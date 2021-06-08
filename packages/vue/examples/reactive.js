const isObject = v => typeof v === 'object' && v !== null

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      console.log('get', key)
      // 1. 更加健壮，在此期间有什么异常，可以更好的捕获
      // 2. 一定会返回一个结果，在这里return出去
      // 既健壮又明确
      const res = Reflect.get(target, key)
      return isObject(res) ? reactive(res) : res
    },
    set(target, key, val) {
      console.log('set', key)
      const res = Reflect.set(target, key, val)
      // 这里有个布尔值可以返回出去了，知道最终操作的结果了
      return res
    },
    deleteProperty(target, key) {
      console.log('delete prop', key)
      const res = Reflect.deleteProperty(target, key)
      return res
    }
  })
}

const state = reactive({
  foo: 'foo',
  bar: {
    baz: 1
  }
})
state.foo
state.foo = 'fooooo'
delete state.foo
state.bar.baz
