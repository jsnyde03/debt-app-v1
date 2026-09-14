"""Writes each plant's find/replace as exact bytes (the targets are CRLF). Run from anywhere; writes into ./plants/."""
import os

here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'plants')
os.makedirs(out, exist_ok=True)


def crlf(s):
    return s.replace('\n', '\r\n').encode('utf-8')


PLANTS = {
    # PL1: the `update` refused branch no longer resets the belief (the claim: "the next change starts one").
    'PL1': (
        "            running = false;\n            lastKey = null;\n          }\n          break;\n        case 'end':",
        "          }\n          break;\n        case 'end':",
    ),
    # PL1c (visibility control, same file): a landed start is not stamped.
    'PL1c': (
        "          if (await bridge.start(action.content)) {\n            running = true;",
        "          if (await bridge.start(action.content)) {\n            running = false;",
    ),
    # PL15: Live Activities turned OFF no longer resets the belief.
    'PL15': (
        "      if (!bridge.areActivitiesEnabled()) {\n        running = false;\n        lastKey = null;\n        return;\n      }",
        "      if (!bridge.areActivitiesEnabled()) {\n        return;\n      }",
    ),
    # PL2: Swift `updateActivity` answers true whether or not anything live took it.
    'PL2': ("      return !live.isEmpty\n", "      return true\n"),
    # PL2c (visibility control, same Swift file): back to a sync Function.
    'PL2c': ('    AsyncFunction("updateActivity")', '    Function("updateActivity")'),
    # PL12: a thrown Guardian read collapses to '' again.
    'PL12': ("    return SPOKEN_READ_FAILED;\n", "    return '';\n"),
    # PL16: the undated fallback always rolls (pre-payday Shortcut / old-build entry).
    'PL16': ("        if (named !== undefined ? named !== landing : clock() < landing) return {};",
             "        if (named !== undefined ? named !== landing : false) return {};"),
    # PL16b: the dated rule is dropped, every entry falls back to the clock (the direction the dated rule exists for).
    'PL16b': ("        if (named !== undefined ? named !== landing : clock() < landing) return {};",
              "        if (clock() < landing) return {};"),
    # PL17: an unreadable date falls back to undated instead of dropping the entry.
    'PL17': ("      if (paydayDateISO !== undefined && !(typeof paydayDateISO === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(paydayDateISO))) {\n        continue;\n      }",
             "      if (false) {\n        continue;\n      }"),
    # PL18: log-payment id not passed through apply.
    'PL18': ("      api.logManualPayment(action.debtId, action.amount, action.id);",
             "      api.logManualPayment(action.debtId, action.amount);"),
    # PL19: payday-landed id not passed (dated rule still refuses a replay of a dated tap; undated on payday?).
    'PL19': ("      api.applyPaydayLandedIntent({ id: action.id, paydayDateISO: action.paydayDateISO });",
             "      api.applyPaydayLandedIntent({ paydayDateISO: action.paydayDateISO });"),
}
for name, (f, r) in PLANTS.items():
    open(os.path.join(out, f'{name}.find'), 'wb').write(crlf(f))
    open(os.path.join(out, f'{name}.repl'), 'wb').write(crlf(r))
print('wrote', sorted(PLANTS))
