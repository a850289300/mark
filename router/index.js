/**
 * 先谈路由基本思路，通过history(popstate) 或 hash(hashchange),监听路由变化，
 * 然后根据当前的路由地址，展示对应的组件(内容)；
 *
 *
 * 因此，实现的方式有很多种，然后接下来实现一个简易的路由插件,相比较大而全的功能，
 * 仅仅实现最简单的功能，用于学习（后续加入导航守卫等）
 *
 * 因为提供Vue使用，所以要结合Vue本身，所以 需要提供 一个 install 方法，
 * 并通过 将 _route，属性定义成响应式的
 *
 */



// 一个简易版本的 VueRouter 目前仅仅实现 简单的路由切换 param meta 等都未实现，主要用于学习记录 路由核心功能

/**
 * VueRouter 类
 * 1. 解析 Route 参数， 创建 映射表（所有路由的信息）。
 * 2. 根据 mode  选择， 创建 history 或者 hash 模式。
 * 3. 提供 init
 */

 /**
  * History 类
  * 1. 主要提供路由切换
  * 2. 根据 path 更新路由，并记录当前路由
  */

  /**
   * HTML5History 类
   * 1. history 模式 popstate 监听路由变化
   * 2. 自己的路径匹配规则
   */

   /**
    * HashHistory
    * 1. hash 模式 hashchange 监听路由变化
    * 2. 自己的路径匹配规则
    */

    /**
     * install
     * 1. Vue.use
     * 2. 混入 beforeCreate
     * 3. 注册 全局 组件
     * 4. <router-view> 执行 render 函数的时候，访问 parent.$route === this._routerRoot._route，触发了它的 getter
     * 更新 _route 时，触发视图更新
     */

     /**
      * Link
      * 简易版本 仅提供 event tag 定于 用于路由更新
      */

      /**
       * View
       * 简易版本 实现的与VueRouter 不相同
       * 主要通过 当前 route，获取组件信息，通过访问 $route 访问到 _route
       * 做到依赖收集，数据更新视图更新
       */

/*
* 创建一个路由
*/
class VueRouter {
  constructor(options) {
    this.app = null; // 配置了 router 的 Vue 根实例
    this.apps = []; // 组件实例的数组
    this.options = options; // 所有参数
    this.beforeHooks = []; // before 钩子函数 list
    this.resolveHooks = []; // resolve 钩子函数 List
    this.afterHooks = []; // after 钩子函数 list
    this.pathList = []; // 所有 path 的集合
    this.pathMap = Object.create(null); // 所有 path 的map 集合
    this.nameMap = Object.create(null); // 所有 name 的map 集合
    this.createRouteMap(options.routes || []); // 创建 route 数据
    this.mode = options.mode || 'hash';
    // console.log(this.pathList,this.pathMap,this.nameMap)
    // 注册 history
    switch (this.mode) {
      case 'history':
        this.history = new HTML5History(this, options.base);
        break
      case 'hash':
        this.history = new HashHistory(this, options.base, this.fallback);
        break
      default:
        break
    }
  }

  // 动态修改路由
  push(location, onComplete, onAbort) {
    this.history.push(location, onComplete, onAbort);
  }

  // 构造 Router Map 方便使用
  createRouteMap(routes) {
    let pathList = this.pathList;
    let pathMap = this.pathMap;
    let nameMap = this.nameMap;
    routes.forEach(route => {
      this.addRouteRecord(pathList, pathMap, nameMap, route);
    });
  }

  // 添加 单个 路由
  addRouteRecord(pathList, pathMap, nameMap, route, parent) {
    let path = route.path; // path
    let name = route.name; // name
    let normalizePath = this.normalizePath(path, parent); // 规范化后的path
    // 路由信息
    let record = {
      path: normalizePath,
      name: name,
      parent: parent,
      components: route.component || { default: route.component }
    };

    // 存在子路由，遍历注册
    if (route.children) {
      route.children.forEach(child => {
        this.addRouteRecord(pathList, pathMap, nameMap, child, record);
      });
    }

    // 记录 PathList pathMap
    if (!pathMap[record.path]) {
      pathList.push(record.path);
      pathMap[record.path] = record;
    }

    // 记录 name Map
    if (name) {
      if (!nameMap[name]) {
        nameMap[name] = record;
      }
    }
  }

  // 规范化path，返回完成的path路径
  normalizePath(path, parent) {
    if (path[0] === '/') { return path }
    if (!parent) { return path }
    return this.cleanPath(((parent.path) + "/" + path))
  }

  // 将 // 替换为 /
  cleanPath (path) {
    return path.replace(/\/\//g, '/')
  }

  // match 匹配路由 最简单的方式
  match(route) {
    let next = typeof route === 'string' ? { path: route } : route;
    let {name, path} = next;
    let nameMap = this.nameMap;
    let pathMap = this.pathMap;
    let record = {}
    if (name) {
      record = nameMap[name]
    } else if (path){
      record = pathMap[path]
    }
    if (!record) {
      this.setError()
      return;
    }
    return this.createRoute(record)
  }

  // error
  setError() {
    alert('找不大404')
  }

  // 返回一个不可修改的数据
  createRoute(record) {
    var route = {
      name: record.name,
      path: record.path || '/',
      parent: record.parent,
      components: record.components
    };
    return Object.freeze(route)
  }

  init(app) {
    this.apps.push(app)
    // 如果根组件已经有了就返回
    if (this.app) {
      return
    }
    this.app = app
    let history = this.history;
    console.log(history, 9999)
    history.transitionTo(
      history.getCurrentLocation()
    )

    history.listen(route => {
      this.apps.forEach(function (app) {
        app._route = route;
      });
    });
  }
}

class History {
  constructor(router, base) {
    this.router = router;
    this.listeners = []; // 所有的监听事件
    this.current = "";
    this.base = this.normalizeBase(base);
    this.cn = () => {};
  }

  // 初始化 Base
  normalizeBase(base) {
    if (!base) {
      base = "/";
    }

    if (base.charAt(0) !== "/") {
      base = "/" + base;
    }

    return base.replace(/\/$/, ""); // 将末尾的 \替换掉
  }

  // 销毁所有事件
  teardown() {
    this.listeners.forEach(fn => {
      fn();
    });
  }

  /**
   * 切换路由
   * @param {*} lactionPath 路径
   * @param {*} fn 成功回调
   */
  transitionTo(lactionPath, fn) {
    if (!lactionPath) {
      return;
    }
    let route = this.router.match(lactionPath, this.current);
    this.updateRoute(route);
    if (typeof fn === "function") {
      fn();
    }
  }

  // 更新路由
  updateRoute(route) {
    this.current = route;
    this.cb && this.cb(route);
  }

  listen(cb) {
    this.cb = cb;
  }
}

class HTML5History extends History{
  constructor(router, base) {
    super(router, base)
    this.setEvent();
  }

  setEvent() {
    window.addEventListener('popstate', this.handleEvent.bind(this));
    this.listeners.push(function () {
      window.removeEventListener('popstate', this.handleEvent.bind(this));
    });
  }

  handleEvent() {
    let location = this.getCurrentLocation();
    this.transitionTo(location);
  }

  // 获取路径
  getCurrentLocation() {
    return this.getLocation(this.base);
  }

  // 获取路径
  getLocation(base) {
    var path = window.location.pathname;
    if (base && path.toLowerCase().indexOf(base.toLowerCase()) === 0) {
      path = path.slice(base.length);
    }
    return (path || '/'); //  + window.location.search + window.location.hash
  }

  // push
  push(locationPath) {
    this.transitionTo(locationPath, () => {
      this.pushState(this.base + locationPath)
    });
  }

  // 修改地址
  pushState(url) {
    history.pushState(null, '', url);
  }
}

class HashHistory extends History{
  constructor(router, base) {
    super(router, base)
    this.setEvent();
  }

  setEvent() {
    window.addEventListener('hashchange', this.handleEvent.bind(this));
    this.listeners.push(() => {
      window.removeEventListener('hashchange', this.handleEvent.bind(this));
    });
  }

  handleEvent() {
    console.log(this, 'hashchange');
    let location = this.getCurrentLocation();
    this.transitionTo(location);
  }

  // 获取路径
  getCurrentLocation() {
    return this.getHash();
  }

  // 获取路径
  getHash() {
    var href = window.location.href;
    var index = href.indexOf('#');
    if (index < 0) { return '/' }
    href = href.slice(index + 1);
    console.log(href, 11111)
    return href
  }

  // push
  push(location) {
    this.transitionTo(location, ()=> {
      window.location.hash = location
    });
  }
}

VueRouter.install = function (Vue) {
  Vue.mixin({
    beforeCreate: function beforeCreate () {
      if (this.$options.router) {
        this._routerRoot = this;
        this._router = this.$options.router;
        this._router.init(this);
        Vue.util.defineReactive(this, '_route', this._router.history.current);
      } else {
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this;
      }
    }
  });

  Object.defineProperty(Vue.prototype, '$router', {
    get: function get () { return this._routerRoot._router }
  });

  Object.defineProperty(Vue.prototype, '$route', {
    get: function get () { return this._routerRoot._route }
  });

  Vue.component('RouterView', View);
  Vue.component('RouterLink', Link);
}

let Link = {
  name: 'RouterLink',
  props: {
    to: {
      type: String,
      required: true
    },
    tag: {
      type: String,
      default: 'a'
    },
    event: {
      type: String,
      default: 'click'
    }
  },
  render(createElement, context) {
    let on = { [this.event]: handler };
    let router = this.$router;
    let data = {};
    let to = this.to
    data.on = on;
    function handler() {
      router.push(to, ()=>{});
    }
    // this.$slots.default 默认的slot
    return createElement(this.tag, data, this.$slots.default);
  }
}

let View = {
  name: 'RouterView',
  functional: true,
  props: {
    name: {
      type: String,
      default: 'default'
    }
  },
  render(createElement, context) {
    let name =  context.props.name;
    let data = context.data;
    let children = context.children;
    let parent = context.parent
    let route = parent.$route || {};
    let component = route.components;
    if (component) {
      return createElement(component, data, children)
    } else {
      return createElement();
    }
  }
}

// if (window.Vue) {
//   window.Vue.use(VueRouter);
// }

export default VueRouter;
