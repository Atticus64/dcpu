declare module 'js-dos/dist/js-dos.js' {
  const Dos: (el: HTMLElement, opts: Record<string, unknown>) => { stop: () => Promise<void> }
  export default Dos
  export { Dos }
}
