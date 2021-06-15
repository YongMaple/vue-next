const isObject = v => typeof v === 'object' && v !== null

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      console.log('get', key)
      // 1. 更加健壮，在此期间有什么异常，可以更好的捕获
      // 2. 一定会返回一个结果，在这里return出去
      // 既健壮又明确
      const res = Reflect.get(target, key)
      // 依赖收集
      track(target, key)
      // 懒处理
      return isObject(res) ? reactive(res) : res
    },
    set(target, key, val) {
      console.log('set', key)
      const res = Reflect.set(target, key, val)
      trigger(target, key)
      // 这里有个布尔值可以返回出去了，知道最终操作的结果了
      return res
    },
    deleteProperty(target, key) {
      console.log('delete prop', key)
      const res = Reflect.deleteProperty(target, key)
      trigger(target, key)
      return res
    }
  })
}

// 创建响应式数据和副作用函数之间依赖关系

// 临时保存响应式函数（传入的fn）
const effectStack = []

// effect: 添加副作用函数
function effect(fn) {
  // 把传入的fn封装一下
  const eff = function() {
    try {
      // 入栈
      effectStack.push(eff)
      // 执行
      fn()
    } finally {
      // 出栈
      effectStack.pop()
    }
  }
  // 立即执行，激活依赖收集的过程
  eff()

  return eff
}

// 存储依赖关系的map
const targetMap = new WeakMap()

// 依赖收集
function track(target, key) {
  const eff = effectStack[effectStack.length - 1]
  if (eff) {
    // 1. 先获取target对应的map
    let depMap = targetMap.get(target)
    if (!depMap) {
      // 首次访问不存在，则创建
      depMap = new Map()
      targetMap.set(target, depMap)
    }
    // 2. 获取key对应的set
    let deps = depMap.get(key)
    if (!deps) {
      // 首次访问不存在，则创建
      deps = new Set()
      depMap.set(key, deps)
    }
    // 3. 建立target,key和eff之间的关系
    deps.add(eff)
  }
}

// 依赖触发
function trigger(target, key) {
  // 通过target获取map
  const depMap = targetMap.get(target)
  if (depMap) {
    // 通过key获取deps
    const deps = depMap.get(key)

    if (deps) {
      // 执行所有副作用
      deps.forEach(dep => dep())
    }
  }
}

// const state = reactive({
//   foo: 'foo',
//   bar: {
//     baz: 1
//   }
// })
// // state.foo
// // state.foo = 'fooooo'
// // delete state.foo
// // state.bar.baz
// effect(() => {
//   console.log('effect1', state.foo)
// })
// effect(() => {
//   console.log('effect2', state.foo, state.bar.baz)
// })
// state.bar.baz = 'fooooooo'
