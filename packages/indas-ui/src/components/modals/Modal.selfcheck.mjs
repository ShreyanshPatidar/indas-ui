// Self-check for nested-modal logic in Modal.tsx.
// Run: node src/components/modals/Modal.selfcheck.mjs
// Mirrors the three pure decisions the component makes. If these break,
// nested modals regress to: child overlaps parent / closing child closes parent.
import assert from 'node:assert/strict'

// --- 1. z-index stacking: a child must paint above its parent ---
const zIndexFor = (depth) => 100 + (depth - 1) * 10
assert.equal(zIndexFor(1), 100, 'root modal sits at 100')
assert.equal(zIndexFor(2), 110, 'nested modal sits above its parent')
assert.ok(zIndexFor(2) > zIndexFor(1), 'child must out-stack parent')
assert.ok(zIndexFor(3) > zIndexFor(2), 'stacking holds at depth 3')
// Overlay sits just under its own content, but above the parent's content.
assert.ok(zIndexFor(2) - 1 >= zIndexFor(1), 'child overlay covers parent content')

// --- 2. onOpenChange forwarding ---
// Controlled modals (open prop supplied) must NOT forward the open=true edge:
// most pass a 0-arg onClose that would read `true` as "close".
// Uncontrolled (trigger-driven) modals MUST forward it or they never open.
const forwardOpenChange = (isControlled, next, cb) => {
  if (isControlled && next) return
  cb(next)
}
const seen = []
forwardOpenChange(true, true, (v) => seen.push(['controlled', v]))
assert.deepEqual(seen, [], 'controlled: opening must not reach onClose')
forwardOpenChange(true, false, (v) => seen.push(['controlled', v]))
assert.deepEqual(seen, [['controlled', false]], 'controlled: closing forwards once')

const un = []
forwardOpenChange(false, true, (v) => un.push(v))
forwardOpenChange(false, false, (v) => un.push(v))
assert.deepEqual(un, [true, false], 'uncontrolled: both edges forward (trigger must still open)')

// --- 3. Escape / popstate / outside-click are owned by the innermost modal ---
const parentShouldIgnore = (childOpenCount) => childOpenCount > 0
assert.equal(parentShouldIgnore(1), true, 'parent ignores events while child is open')
assert.equal(parentShouldIgnore(0), false, 'parent handles events once child closed')

// Open child then close it — parent must become responsive again, not stay stuck.
let count = 0
count += 1
assert.equal(parentShouldIgnore(count), true, 'child open -> parent inert')
count -= 1
assert.equal(parentShouldIgnore(count), false, 'child closed -> parent live again')
assert.equal(count, 0, 'registry balances to zero (no leak)')

// --- 4. Back-button sentinels are matched by id, not by a shared flag ---
// Regression: applying in a nested modal closed the parent. Cleanup order is
// [child registry -1] -> [child history back()] -> [popstate later], so a
// counter read inside popstate is already 0 and cannot protect the parent.
function makeHistory() {
  const stack = [{}]
  const listeners = new Set()
  const pending = []
  return {
    state: () => stack[stack.length - 1],
    push: (s) => stack.push(s),
    back: () => { stack.pop(); pending.push(1) },       // popstate is async
    listen: (fn) => listeners.add(fn),
    unlisten: (fn) => listeners.delete(fn),
    drain: () => { while (pending.length) { pending.pop(); [...listeners].forEach(f => f()) } },
  }
}

function mountModal(h, seq, onClose, childCountRef = { current: 0 }) {
  const id = ++seq.n
  h.push({ __modal: true, __modalId: id })
  let selfPopped = false
  const onPopState = () => {
    const st = h.state()
    // Our sentinel is back on top => a child popped, we survived.
    if (st && st.__modal && st.__modalId === id) return
    if (childCountRef.current > 0) return
    selfPopped = true
    onClose()
  }
  h.listen(onPopState)
  return {
    unmount: () => {
      h.unlisten(onPopState)
      if (selfPopped) return
      const st = h.state()
      if (st && st.__modal && st.__modalId === id) h.back()
    },
  }
}

{
  // Parent enquiry modal open, child material modal open, child Applies.
  const h = makeHistory(), seq = { n: 0 }
  let parentClosed = false, childClosed = false
  const parent = mountModal(h, seq, () => { parentClosed = true })
  const child = mountModal(h, seq, () => { childClosed = true })

  child.unmount()   // Apply -> child retracts its own sentinel
  h.drain()         // popstate arrives afterwards

  assert.equal(parentClosed, false, 'APPLY REGRESSION: child close must not close the parent')
  assert.equal(childClosed, false, 'child closed itself explicitly, not via popstate')
  parent.unmount()
}

{
  // Device back button with only the parent open — must still close it.
  const h = makeHistory(), seq = { n: 0 }
  let closed = false
  mountModal(h, seq, () => { closed = true })
  h.back()
  h.drain()
  assert.equal(closed, true, 'back button must still close a lone modal')
}

console.log('Modal nested-modal self-check: all assertions passed')
