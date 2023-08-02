export const scshot = {
	// 定点
	fixPoint: {
		x: 0,
		y: 0
	},
	// 动点的移动范围
	limitRect: {
		x1: 0, y1: 0, x2: 0, y2: 0
	},
	mousedownListenerHandler: null,
	mousemoveListenerHandler: null,
	mouseupListenerHandler: null,
	dom: null,
	//被调整控制点的类名
	ctrlPointClassName: '',
	isDraw: false,
	isResize: false,
	movePoint: { x: 0, y: 0 },
	BoundingClientRect: null,
	getPointFromSection(point, min, max) {
		let p = 0;
		if (point - min <= 0) {
			p = min;
		} else if (point - min > 0 && point - max <= 0) {
			p = point;
		} else {
			p = max;
		}
		return p;
	},
	drawRect(position) {
		this.setProperty('--rect-top', position.top);
		this.setProperty('--rect-left', position.left);
		this.setProperty('--rect-width', position.width);
		this.setProperty('--rect-height', position.height);
	},
	//修改css变量的值
	setProperty(key, val) {
		document.documentElement.style.setProperty(key, val);
	},
	//获取css变量的值
	getPropertyValue(key) {
		return window.getComputedStyle(document.documentElement).getPropertyValue(key);
	},
	// 鼠标状态 为了知道鼠标移动时是否被按下
	mousedown: false,
	setMouseDown() {
		this.mousedown = true;
	},
	setMouseUp() {
		this.mousedown = false;
	},
	getMouseDown() {
		return this.mousedown;
	},
	// 根据给定的两个点计算矩形的位置 及 宽高 limit是p2的移动范围x1 y1 x2 y2
	// p1是定点 p2是动点 注意在不同的情况下定点是不一样的
	// 比如在调整矩形四个顶点的时候，动点是鼠标所在点，定点是鼠标所在点矩形对角线上的另一点
	// 在调整矩形四个中点的时候，也可以想象为调整顶点的特殊情况，从而确定一个定点，一个动点
	calcWidthHeight(p1, p2, limitRect) {
		// 返回 top left width height 
		let width = 0;
		let height = 0;
		let top = 0;
		let left = 0;

		if (p2.x - limitRect.x2 >= 0) {//大于等于右边界
			width = limitRect.x2 - p1.x;
			left = p1.x;
		} else if (p2.x - limitRect.x1 <= 0) {//小于等于左边界
			width = Math.abs(limitRect.x1 - p1.x);
			left = limitRect.x1;
		} else {//在边界范围内
			width = Math.abs(p2.x - p1.x);
			if (p2.x - p1.x > 0) {
				left = p1.x;
			} else {
				left = p2.x;
			}
		}

		if (p2.y - limitRect.y2 >= 0) {//大于等于下边界
			height = limitRect.y2 - p1.y;
			top = p1.y;
		} else if (p2.y - limitRect.y1 <= 0) {//小于等于上边界
			height = Math.abs(limitRect.y1 - p1.y);
			top = limitRect.y1;
		} else {
			height = Math.abs(p2.y - p1.y);
			if (p2.y - p1.y > 0) {
				top = p1.y;
			} else {
				top = p2.y;
			}
		}
		// 兼容减去浏览器高度
		top = top - 65 + 'px';
		left = left + 'px';
		width = width + 'px';
		height = height + 'px';

		return { top, left, width, height };
	},
	mousedownListener(e) {
		// 清除蒙层颜色
		this.dom.style.backgroundColor = ''

		this.dom.addEventListener('mousemove', this.mousemoveListenerHandler);
		document.documentElement.addEventListener('mouseup', this.mouseupListenerHandler);
		console.log("鼠标按下了",e)

		//e.stopPropagation();
		let rect = document.getElementById('rect');
		// 页面中没有存在的情况下需要写入到元素中去
		if (rect == null) {
			const bgDom = e.target // 遮盖dom 
			let lineRect = document.createElement("div")
			lineRect.id = 'rect'
			lineRect.className = 'rect'
			lineRect.innerHTML = `<div class='nw'></div>
                                <div class='n'></div>
                                <div class='ne'></div>
                                <div class='e'></div>
                                <div class='se'></div>
                                <div class='s'></div>
                                <div class='sw'></div>
                                <div class='w'></div>`
			bgDom.parentElement.append(lineRect)
		}
		rect = document.getElementById('rect');
		// 检测矩形选框是否已经显示，已经显示的不作处理
		let display = window.getComputedStyle(rect)['display'];
		console.log('display:',display)
		if (display == 'none') {
			this.isDraw = true;
			this.setMouseDown();
			this.fixPoint.x = e.clientX;
			this.fixPoint.y = e.clientY;
			
			//设置位置
			this.setProperty('--rect-left', e.clientX + 'px');
			this.setProperty('--rect-top', (e.clientY - 65) + 'px'); // 65手工矫正数字
			//设置宽高
			this.setProperty('--rect-width', '0px');
			this.setProperty('--rect-height', '0px');
			// 显示矩形
			rect.style.display = 'block';
			// 显示后立刻给矩形加对应的鼠标事件监听
			document.querySelector('.rect').addEventListener('mousedown', this.mousedownListenerHandler);
			document.querySelector('.rect').addEventListener('mousemove', this.mousemoveListenerHandler);
		} else {
			// 判断如果点的是控制点则处理
			let className = e.target.className;
			//console.log(className);
			if (!className) {
				return false;
			}
			let classList = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'rect'];
			if (classList.indexOf(className) !== -1) {
				this.isResize = true;
				this.setMouseDown();
				this.ctrlPointClassName = className;
				this.BoundingClientRect = rect.getBoundingClientRect();
				this.movePoint = { x: e.clientX, y: e.clientY};
				console.log("处理没个点的位置",this.movePoint)
			} else {
				return false;
			}
		}
	},
	// 鼠标移动监听
	mousemoveListener(e) {
		console.log("鼠标移动了",e)
		e.stopPropagation();
		if (this.getMouseDown()) {
			// 鼠标按下时，限制鼠标的移动范围（可能不太现实，但是超出范围后可以不响应）
			if (this.isDraw) {
				let position = this.calcWidthHeight(this.fixPoint, { x: e.clientX, y: e.clientY }, this.limitRect);
				//console.log(position);
				//console.log({x:e.clientX,y:e.clientY});
				this.drawRect(position);
			} else if (this.isResize) {
				let BoundingRect = this.BoundingClientRect;//该数据适用于调整大小，有一个固定点的情况，不适用移动
				let position = {};
				/*bottom: 151
				  height: 101
				  left: 196
				  right: 299
				  top: 50
				  width: 103
				  x: 196
				  y: 50*/
				//操作不同的控制点，定点 和 动点不一样
				// 移动的是矩形四个顶点时 top left width height都会改变
				// 移动的是矩形左右两个中点时 left width会改变
				// 移动的是矩形上下两个中点时 top height会改变
				switch (this.ctrlPointClassName) {
					case 'nw': // 调整nw点 定点是se点
						this.fixPoint.x = BoundingRect.left + BoundingRect.width;
						this.fixPoint.y = BoundingRect.top + BoundingRect.height;
						position = this.calcWidthHeight(this.fixPoint, { x: e.clientX, y: e.clientY }, this.limitRect);
						this.drawRect(position);
						break;
					case 'n':
						this.fixPoint.x = BoundingRect.left;
						this.fixPoint.y = BoundingRect.top + BoundingRect.height;
						position = this.calcWidthHeight(this.fixPoint, { x: BoundingRect.left + BoundingRect.width, y: e.clientY }, this.limitRect);
						this.drawRect(position);
						break;
					case 'ne':
						this.fixPoint.x = BoundingRect.left;
						this.fixPoint.y = BoundingRect.top + BoundingRect.height;
						position = this.calcWidthHeight(this.fixPoint, { x: e.clientX, y: e.clientY }, this.limitRect);
						this.drawRect(position);
						break;
					case 'e':
						this.fixPoint.x = BoundingRect.left;
						this.fixPoint.y = BoundingRect.top;
						position = this.calcWidthHeight(this.fixPoint, { x: e.clientX, y: BoundingRect.top + BoundingRect.height }, this.limitRect);
						this.drawRect(position);
						break;
					case 'se':
						this.fixPoint.x = BoundingRect.left;
						this.fixPoint.y = BoundingRect.top;
						position = this.calcWidthHeight(this.fixPoint, { x: e.clientX, y: e.clientY }, this.limitRect);
						this.drawRect(position);
						break;
					case 's':
						this.fixPoint.x = BoundingRect.left;
						this.fixPoint.y = BoundingRect.top;
						position = this.calcWidthHeight(this.fixPoint, { x: BoundingRect.left + BoundingRect.width, y: e.clientY }, this.limitRect);
						this.drawRect(position);
						break;
					case 'sw':
						this.fixPoint.x = BoundingRect.left + BoundingRect.width;
						this.fixPoint.y = BoundingRect.top;
						position = this.calcWidthHeight(this.fixPoint, { x: e.clientX, y: e.clientY }, this.limitRect);
						this.drawRect(position);
						break;
					case 'w':
						this.fixPoint.x = BoundingRect.left + BoundingRect.width;
						this.fixPoint.y = BoundingRect.top;
						position = this.calcWidthHeight(this.fixPoint, { x: e.clientX, y: BoundingRect.top + BoundingRect.height }, this.limitRect);
						this.drawRect(position);
						break;
					case 'rect'://移动位置 宽和高是固定不变的 
						//在上面mousedown的事件中，按下鼠标时记下鼠标当时的坐标，它与矩形的左上角有个距离差
						//在移动的过程中，永远保持这个距离差，并且注意控制左上角的移动范围，即可实现移动矩形框，
						//并且矩形不变形
						let leftDistance = this.movePoint.x - BoundingRect.x;
						let topDistance = this.movePoint.y - BoundingRect.y;
						let nowLeft = e.clientX - leftDistance;
						let nowTop = e.clientY - topDistance;

						let finalLeft = this.getPointFromSection(nowLeft, this.limitRect.x1, this.limitRect.x2 - BoundingRect.width);
						let finalTop = this.getPointFromSection(nowTop, this.limitRect.y1, this.limitRect.y2 - BoundingRect.height);

						position = { left: finalLeft + 'px', top: finalTop + 'px', width: BoundingRect.width + 'px', height: BoundingRect.height + 'px' };

						this.drawRect(position);
						break;
					default:
						return;
				}
			}

		} else {
			// 不处理
		}
	},
	// 鼠标有可能移出监控区域后再释放，所以在任何地方释放，都应该调用setMouseUp();
	mouseupListener(e) {
		this.setMouseUp();
		this.isDraw = false;
		this.isResize = false;

		// 删除事件
		this.dom.removeEventListener('mousedown', this.mousedownListenerHandler)
		this.dom.removeEventListener('mousemove', this.mousemoveListenerHandler)
		document.documentElement.removeEventListener('mouseup', this.mouseupListenerHandler)

		const allowClass = ['se', 'rect', 'nw']
		if (!allowClass.includes(e.target.className)) return

		// 生成快捷选项
		console.log("快捷", e, this)
		const bgDom = e.target.parentElement.parentElement
		let scshotTools = document.getElementById('scshotTools');
		if (scshotTools == null) {
			let lineRect = document.createElement("div")
			lineRect.id = 'scshotTools'
			lineRect.className = 'shotTools'
			lineRect.innerHTML = `<input type="button" id="scshotTools_cancel" value="❌">
            <input type="button" id="scshotTools_determine" value="✅">`
			bgDom.append(lineRect)
		}

		/**清除截图元素 */
		const removeScShotElements = () => {
			document.getElementById('rect').remove()
			document.getElementById('scshotTools').remove()
		}

		// 为工具绑定对应函数
		document.getElementById("scshotTools_determine").onclick = function () {
			let rectBoundingRect = document.querySelector('#rect').getBoundingClientRect();
			console.log("rectBoundingRect", rectBoundingRect)
			const screenshot_finish_event = new CustomEvent("screenshot_finish", {detail:rectBoundingRect})
			document.dispatchEvent(screenshot_finish_event)
			removeScShotElements()
		}

		document.getElementById("scshotTools_cancel").onclick = function () {
			const screenshot_finish_event = new CustomEvent("screenshot_finish", {detail:null})
			document.dispatchEvent(screenshot_finish_event)
			removeScShotElements()
		}
	},

	// dom是要截图的对象
	async clipOn(dom) {
		this.dom = dom

		// 截图前通过修改蒙层颜色提示截图
		this.dom.style.backgroundColor = "#bbbbbb7a"
		// 增加handler解决事件移除问题
		this.mousedownListenerHandler = this.mousedownListener.bind(this)
		this.mousemoveListenerHandler = this.mousemoveListener.bind(this)
		this.mouseupListenerHandler = this.mouseupListener.bind(this)
		dom.style.cursor = "crosshair" // 开始截图时将指针在目标区域切换为十字
		let BoundingRect = JSON.parse(JSON.stringify(dom.getBoundingClientRect()))
		BoundingRect.x = BoundingRect.left = (BoundingRect.left + window.scrollX);
		BoundingRect.y = BoundingRect.top = (BoundingRect.top + window.scrollY);
		this.fixPoint = { x: 0, y: 0 }; //p1 矩形的定点
		// 绘制时p2的移动范围 左上角 和 右下角
		this.limitRect = {
			x1: BoundingRect.x,
			y1: BoundingRect.y,
			x2: BoundingRect.x + BoundingRect.width,
			y2: BoundingRect.y + BoundingRect.height
		};
		// 绘制
		dom.addEventListener('mousedown', this.mousedownListenerHandler);
		return new Promise((resolve,reject)=>{
			const screenshotResponse = function(data){
				dom.style.cursor = "default" // 恢复鼠标样式
				document.removeEventListener('screenshot_finish',screenshotResponse)
				resolve( JSON.parse(JSON.stringify(data.detail)))
			}
			document.addEventListener("screenshot_finish",screenshotResponse)
		})
	}

};
