# Debt Planner V1 Release QA Checklist

## Core flows
- [ ] First-run setup
- [ ] Add required expense
- [ ] Add living expense reserve
- [ ] Add debt
- [ ] Add goal
- [ ] Mark required action paid
- [ ] Undo required action
- [ ] Edit recommended action amount
- [ ] Mark recommended action complete
- [ ] Undo recommended action
- [ ] Rollover pay cycle
- [ ] Export backup

## Mobile
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Keyboard does not block inputs
- [ ] Bottom nav does not overlap content
- [ ] Dark mode readable
- [ ] Long debt names wrap cleanly
- [ ] Large debt list remains usable

## Financial accuracy
- [ ] APR projection checked
- [ ] Payoff date checked
- [ ] Snowball ordering checked
- [ ] Avalanche ordering checked
- [ ] Living reserve reduces flexible cash
- [ ] Partial recommendation redistributes remaining cash

## Release
- [ ] Lint passes
- [ ] Regression tests pass
- [ ] E2E tests pass
- [ ] Production build passes
- [ ] Lighthouse production check
