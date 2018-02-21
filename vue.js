function Vue(options){
  //劫持所有data中的数据
  this.data = options.data;
  var data = this.data;
  observe(data,this);

  //获取指定节点，生成fragemnt并插入回该节点
  var id = options.el;
  var fragment = toFragment(id,this);
  document.getElementById(id).appendChild(fragment);
}

//Dep的实现
function Dep(){
  this.subs = [];//订阅者数组
}
Dep.prototype = {
  //添加订阅者
  addSub:function(sub){
    this.subs.push(sub);
  },
  //通知所有订阅者，让每个订阅者都触发update函数
  notify:function(){
    this.subs.forEach(function(sub){
      sub.update();
    })
  }
}

//Watcher的实现
function Watcher (vm, node, dataName, nodeType) {
  Dep.target = this;
  this.dataName = dataName;
  this.node = node;
  this.vm = vm;
  this.nodeType = nodeType;
  this.update();
  Dep.target = null;
}
Watcher.prototype = {
  // 获取 data 中的属性值
  get: function () {
    this.value = this.vm[this.dataName]; // 触发相应属性的 get
  },
  update: function () {
    this.get();
    if (this.nodeType === 'text') {
      this.node.nodeValue = this.value;
    }
    if (this.nodeType === 'input') {
      this.node.value = this.value;
    }
    if (this.nodeType === 'innerText') {
      this.node.innerText = this.value;
    }
  }
}


//遍历data，执行defineReactive
function observe(data,vm){
  Object.keys(data).forEach(function(key){
    defineReactive(vm,key,data[key]);
  })
}

//处理get和set时候的订阅发布逻辑
function defineReactive(vm,key,val){
  //为该data生成一个新的发布者
  var dep = new Dep();
  Object.defineProperty(vm,key,{
    //当遇到有对该data取值的地方时，就会添加watcher来订阅它
    get:function(){
      if(Dep.target){
        dep.addSub(Dep.target);
      }
      return val;
    },
    set:function(newVal){
      if(val===newVal){
        return;
      }
      val = newVal;
      //发布者发布新数据
      dep.notify();
    }
  })
}

//遍历检查劫持子节点，生成fragment
function toFragment(id,vm){
  var node = document.getElementById(id);
  var fragment = document.createDocumentFragment();
  var child;
  //遍历所有子节点
  while(child = node.firstChild){
    compile(child,vm);
    fragment.appendChild(child);
  }
  return fragment;
}

//处理元素
function compile(node,vm){
  var reg = /\{\{(.*)\}\}/;
  //如果节点是元素节点
  if(node.nodeType===1){
    //匹配到{{}}这样的格式
    if (reg.test(node.innerText)) {
      var dataName = RegExp.$1; // 获取匹配到的字符串
      dataName = dataName.trim();
      new Watcher(vm, node, dataName, 'innerText');
    }
    //表单类型且有v-model的
    else{
      var attrs = node.attributes;
      for(var i=0;i<attrs.length;i++){
        if(attrs[i].nodeName==='v-model'){
          var dataName = attrs[i].nodeValue;
          node.addEventListener('input',function(e){
            vm[dataName] = e.target.value;
          },false);
          node.value = vm[dataName];
          node.removeAttribute('v-model');
          break;
        }
      };
      new Watcher(vm, node, dataName, 'input');
    }
  }
  // 节点类型为 text
  else if (node.nodeType === 3) {
    //匹配到{{}}这样的格式
    if (reg.test(node.nodeValue)) {
      var dataName = RegExp.$1; // 获取匹配到的字符串
      dataName = dataName.trim();
      new Watcher(vm, node, dataName, 'text');
    }
  }
}