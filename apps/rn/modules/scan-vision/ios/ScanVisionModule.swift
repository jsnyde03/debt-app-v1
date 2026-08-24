import ExpoModulesCore
import UIKit
import Vision
import VisionKit

/**
 * §2.8 scan-to-prefill — the native OCR edge (iOS, Apple-only, fully on-device).
 *
 * `scanDocument()` presents Apple's `VNDocumentCameraViewController` (the system document scanner, with
 * edge detection + perspective correction), then runs `VNRecognizeTextRequest` over each scanned page
 * and resolves the joined recognized text. The JS side (`src/lib/scan.ts`) hands that text to the pure
 * `parseStatementText` parser. Nothing leaves the device — no network, no third-party — which is the
 * whole point (the on-device trust moat).
 *
 * ⚠️ Device-QA only: the camera / VisionKit / Vision paths cannot run in the simulator's photo flows or
 * on web — verify on real hardware at Phase 6.
 */
public class ScanVisionModule: Module {
  // Held for the lifetime of a scan so the delegate isn't deallocated mid-presentation.
  private var activeDelegate: ScannerDelegate?

  public func definition() -> ModuleDefinition {
    Name("ScanVision")

    AsyncFunction("scanDocument") { (promise: Promise) in
      DispatchQueue.main.async {
        guard VNDocumentCameraViewController.isSupported else {
          promise.reject("E_UNSUPPORTED", "Document scanning isn’t supported on this device.")
          return
        }
        guard let presenter = self.appContext?.utilities?.currentViewController() else {
          promise.reject("E_NO_PRESENTER", "No view controller available to present the scanner.")
          return
        }

        let scanner = VNDocumentCameraViewController()
        let delegate = ScannerDelegate(promise: promise) { [weak self] in
          self?.activeDelegate = nil
        }
        self.activeDelegate = delegate
        scanner.delegate = delegate
        presenter.present(scanner, animated: true)
      }
    }
  }
}

private class ScannerDelegate: NSObject, VNDocumentCameraViewControllerDelegate {
  private let promise: Promise
  private let onDone: () -> Void

  init(promise: Promise, onDone: @escaping () -> Void) {
    self.promise = promise
    self.onDone = onDone
  }

  func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFinishWith scan: VNDocumentCameraScan) {
    controller.dismiss(animated: true)

    var pages = [String](repeating: "", count: scan.pageCount)
    let group = DispatchGroup()
    for i in 0..<scan.pageCount {
      group.enter()
      recognizeText(in: scan.imageOfPage(at: i)) { text in
        pages[i] = text
        group.leave()
      }
    }
    group.notify(queue: .main) {
      self.promise.resolve(pages.joined(separator: "\n"))
      self.onDone()
    }
  }

  func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
    controller.dismiss(animated: true)
    // A cancel is not an error — resolve empty so the JS flow just closes without prefilling.
    promise.resolve("")
    onDone()
  }

  func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) {
    controller.dismiss(animated: true)
    promise.reject("E_SCAN_FAILED", error.localizedDescription)
    onDone()
  }
}

/** Run Apple Vision text recognition over one page image, returning the recognized text (line-joined). */
private func recognizeText(in image: UIImage, completion: @escaping (String) -> Void) {
  guard let cgImage = image.cgImage else {
    completion("")
    return
  }
  let request = VNRecognizeTextRequest { req, _ in
    let text = (req.results as? [VNRecognizedTextObservation])?
      .compactMap { $0.topCandidates(1).first?.string }
      .joined(separator: "\n") ?? ""
    completion(text)
  }
  request.recognitionLevel = .accurate
  request.usesLanguageCorrection = true

  DispatchQueue.global(qos: .userInitiated).async {
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    do {
      try handler.perform([request])
    } catch {
      completion("")
    }
  }
}
