export const uniq = <T>(array: T[]): T[] => {
  return array.filter((e, i) => {
    return array.indexOf(e) === i
  })
}
