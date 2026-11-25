import scan from './parse/fromText.js'

// find each number - 'dos mil tres' is one, and 'dos tres', 'dos, tres' and 'cuarenta y 3' are two
const findNumbers = function (view) {
  const ptrs = []
  view.match('#Value+').fullPointer.forEach(ptr => {
    const [n, start, end] = ptr
    scan(view.document[n].slice(start, end)).forEach(res => {
      ptrs.push([n, start + res.start, start + res.end])
    })
  })
  return view.update(ptrs)
}
export default findNumbers
