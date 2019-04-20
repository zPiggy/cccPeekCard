
const { ccclass, property } = cc._decorator;

@ccclass
/**
* 组件基类 
* 自动引用被@property 装饰的子节点及子节点以下节点
* 规则:
* 1.扩展(占用)tooltip装饰 用来标记被装饰自定义属性的节点引用路径【相对路径】
*      tooltip用例：  rootNode -> myComponent extends BaseComponent
*                      ┗child1 -> 
*                          ┗child1_1 -> 
*                          ┗child1_2 -> 
*      若想在myComponent完成自动引用child1_1 ==> tooltip:"child1/child1_1"
* 2.支持数组格式【以\n分割】
*   同1节点结构：tooltip:"child1/child1_1\nchild1/child1_2"
* 3.如果不指定tooltip则默认引用子节点下与属性同名节点
* 4.不在编辑器显示的属性会被忽略
*   a.以'_'开头命名
*   b.指定 visible:false
* 5.找不到的节点会在组建会被忽略并保持原有引用
* 6.如果想引用其他节点上的节点或者组件或者资源类型，根据5的特性可按照原始方式：手动拖动到引用槽
*
* 备注：若有其他自动引用需求,可在resetInEditor2中diy特定或者复杂引用
*/
export default class BaseComponent extends cc.Component {

    @property({ tooltip: "重新创建当前属性所有引用\n无法被自动引用的属性将保持不变\n1.找不到的节点\n2.找不到的类型(图声字等资源类型)" })
    get reset() {
        return false;
    }
    set reset(v) {
        this.resetInEditor();
    }
    /**
     * resetInEditor被占用
     * 作为补偿提供一个resetInEditor的回调函数
     * 可在子类重写此函数
     */
    resetInEditor2: () => void = undefined;
    resetInEditor() {
        let setProto = (key: string, uri: string, ctor: any, isArray: boolean = false) => {
            if (!uri) return;
            let node = cc.find(uri, this.node);
            let value = undefined;
            if (node) {
                value = ctor == cc.Node ? node : node.getComponent(ctor);
            }
            if (value) {
                if (isArray) {
                    this[key].push(value);
                }
                else {
                    this[key] = value;
                }
            }
        }
        let Attr = (<any>cc.Class).Attr
        let cClass = cc.js.getClassByName(cc.js.getClassName(this));
        let attrs = Attr.getClassAttrsProto(cClass);
        let DELIMETER = Attr.DELIMETER;
        for (const key in this) {
            let visible = attrs[key + DELIMETER + "visible"];
            if (key[0] === '_' || visible === false) continue;
            //感谢Jare技术支持
            let ctor = attrs[key + DELIMETER + "ctor"];
            let defaultValue = attrs[key + DELIMETER + "default"];
            let tooltip: string = attrs[key + DELIMETER + "tooltip"];
            if (this.hasOwnProperty(key) && ctor) {
                //自动查找引用 查找tooltip指定节点或同名节点 并获取对应的组件类型
                if (defaultValue && Array.isArray(defaultValue)) {  //数组
                    let uris = tooltip.split('\n');
                    this[key] = <any>[];        //重置
                    for (let i = 0; i < uris.length; i++) {
                        let uri = uris[i];
                        setProto(key, uri, ctor, true);
                    }
                }
                else {
                    let uri = tooltip ? tooltip : key;
                    setProto(key, uri, ctor);
                }
            }
        }

        if (this.resetInEditor2) {
            this.resetInEditor2();

        }
    }

}
