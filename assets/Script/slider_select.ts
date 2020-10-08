const {ccclass, property, menu} = cc._decorator;

/**滑动选择组件 */
@ccclass
@menu("tool/slider_select")
export default class slider_select extends cc.Component {
    /* *****************private***************** */
    private _last_pos_o: cc.Vec3;
    private _content_o: cc.Node;
    private _layout_o: cc.Layout;
    private _view_o: cc.Node;
    private _list_o: cc.ScrollView;
    /**选中节点下标 */
    private _selected_n: number;
    /**监听滑动状态 */
    private _listen_b = false;
    /* *****************组件***************** */
    @property({ displayName: "阈值", type: cc.Float, min: 0.1 })
    threshold_n = 1;
    /* --------------------------------segmentation-------------------------------- */
    onLoad() {
        this._list_o = this.node.getComponent(cc.ScrollView);
        this._content_o = this._list_o.content;
        this._layout_o = this._content_o.getComponent(cc.Layout);
        this._view_o = this._content_o.parent;
        this._last_pos_o = this._content_o.position;
        // ------------------初始化视图
        this._event_scrolling();
    }
    onEnable() {
        this.listen_b = true;
        this.node.on("scroll-ended", this._event_scroll_ended, this);
        this.node.on(cc.Node.EventType.TOUCH_START, this._event_touch_start, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._event_touch_end_and_cancel, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._event_touch_end_and_cancel, this);
    }
    onDisable() {
        this.listen_b = false;
        this.node.off("scroll-ended", this._event_scrolling, this);
        this.node.on(cc.Node.EventType.TOUCH_START, this._event_touch_start, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this._event_touch_end_and_cancel, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this._event_touch_end_and_cancel, this);
    }
    /* ***************功能函数*************** */
    /**跳转到指定item中心 */
    private _jump_to_item(index_n_: number): number {
        // ------------------准备参数
        /**中心区域大小 */
        let center_size_o = new cc.Size(this._list_o.node.width, this._content_o.height - this._view_o.height);
        /**跳转的item位置(百分比) */
        let jump_pos_n = (this._content_o.children[index_n_].y + this._content_o.height * this._content_o.anchorY - this._view_o.height * 0.5) / center_size_o.height;
        // cc.log(jump_pos_n);
        if (jump_pos_n > 1 || jump_pos_n < 0) {
            return jump_pos_n;
        }
        // ------------------更新视图
        this.listen_b = false;
        this._list_o.stopAutoScroll();
        /**跳转到指定item */
        this._list_o.scrollTo(cc.v2(0, jump_pos_n), this.threshold_n);
        return jump_pos_n;
    }
    /**刷新视图(添加子节点后调用) */
    public update_view(): void {
        this._layout_o.updateLayout();
        this._event_scrolling();
    }
    /* ***************自定义事件*************** */
    private _event_scrolling(): void {
        // console.clear();
        // ------------------参数安检
        if (!this._content_o.children.length) {
            return;
        }
        // 不存在中心区域无意义
        if (this._content_o.height <= this._view_o.height) {
            return;
        }
        // ------------------准备参数
        let temp1_o = new cc.Vec3, temp2_o = new cc.Vec3;
        let temp1_n: number, temp2_n: number, temp3_n: number, temp4_n: number;
        // ------------------阈值安检
        this._content_o.position.sub(this._last_pos_o, temp1_o);
        this._last_pos_o = this._content_o.position;
        // 超出预设阈值退出
        // cc.log(temp1_o.len());
        if (temp1_o.len() > this.threshold_n) {
            return;
        }
        // ------------------准备参数
        let item_size_o = new cc.Size(this._content_o.children[0].width, this._content_o.children[0].height + this._layout_o.spacingY);
        // ------------------计算中心点
        this._view_o.parent.convertToWorldSpaceAR(cc.Vec3.ZERO, temp1_o);
        this._content_o.convertToNodeSpaceAR(temp1_o, temp2_o);
        // 顶部坐标
        temp1_n = this._content_o.height - this._content_o.anchorY * this._content_o.height;
        // ------------------顶部item
        temp2_n = 0;
        temp1_n -= this._layout_o.paddingTop + this._content_o.children[0].height + this._layout_o.spacingY * 0.5;
        if (temp1_n <= temp2_o.y) {
            // cc.log(temp2_n);
            this._selected_n = temp2_n;
            if (this._list_o.isScrolling()) {
                return;
            }
            temp4_n = this._jump_to_item(temp2_n);
            if (temp4_n >= 0 && temp4_n <= 1) {
                return;
            }
        }
        // ------------------中部item
        temp3_n = this._content_o.children.length - 1;
        if (temp3_n < 1) {
            temp3_n = 1;
        }
        for (temp2_n = 1; temp2_n < temp3_n; ++temp2_n) {
            temp1_n -= item_size_o.height;
            if (temp1_n <= temp2_o.y) {
                // cc.log(temp2_n);
                this._selected_n = temp2_n;
                if (this._list_o.isScrolling()) {
                    return;
                }
                temp4_n = this._jump_to_item(temp2_n);
                if (temp4_n < 0) {
                    this._jump_to_item(temp2_n - 1);
                    return;
                } else if (temp4_n <= 1) {
                    return;
                }
            }
        }
        // ------------------底部item
        temp1_n -= this._content_o.children[0].height + this._layout_o.spacingY * 0.5 + this._layout_o.paddingBottom;
        if (temp1_n <= temp2_o.y) {
            // cc.log(temp2_n);
            this._selected_n = temp2_n;
            if (this._list_o.isScrolling()) {
                return;
            }
            this._jump_to_item(temp2_n);
        }
    }
    private _event_scroll_ended(): void {
        // ------------------更新监听
        if (!this.listen_b) {
            this.listen_b = true;
        }
        this._event_scrolling();
    }
    private _event_touch_start(): void {
        // ------------------更新监听
        if (!this.listen_b) {
            this.listen_b = true;
        }
    }
    private _event_touch_end_and_cancel(): void {
        if (!this._list_o.isAutoScrolling()) {
            this._event_scrolling();
        }
    }
    /* ***************重载读/写*************** */
    /**选中节点下标 */
    get selected_n() { return this._selected_n; }
    /**监听滑动事件状态 */
    private get listen_b() { return this._listen_b; }
    private set listen_b(v_b_) {
        this._listen_b = v_b_;
        if (this._listen_b) {
            this.node.on("scrolling", this._event_scrolling, this);
        } else {
            this.node.off("scrolling", this._event_scrolling, this);
        }
    }
}