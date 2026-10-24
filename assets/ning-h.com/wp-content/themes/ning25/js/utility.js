class AnimationManager {
    constructor() {
        this.animations = [];
        this.resizeHandler = null;
        this.updateTimeout = null;
    }

    register(cleanupFunction) {
        if (typeof cleanupFunction === 'function') {
            this.animations.push(cleanupFunction);
        }
        return this;
    }

    setResizeHandler(handler) {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        this.resizeHandler = handler;
        window.addEventListener('resize', this.resizeHandler);
        return this;
    }

    setTimeout(callback, delay) {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(callback, delay);
        return this;
    }

    initializeBase() {
        ScrollTrigger.getAll().forEach(st => st.kill());
        return this;
    }

    destroy() {
        ScrollTrigger.getAll().forEach(st => st.kill());

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = null;
        }

        this.animations.forEach(cleanup => {
            if (typeof cleanup === 'function') {
                cleanup();
            }
        });
        this.animations = [];
    }
}

window.animationManager = new AnimationManager();


function lenisInitialize() {
    if (window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches) return () => {};
    try {
        gsap.registerPlugin(ScrollTrigger);

        // 确保在初始化前重置滚动位置
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // 创建 Lenis 实例，添加更多配置选项
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
            syncTouch: true,
            syncTouchLerp: 0.04,
            touchInertiaMultiplier: 20,
            lerp: 0.1,
            autoResize: true
        });

        // 强制滚动到顶部
        lenis.scrollTo(0, { immediate: true });

        // 设置历史记录滚动行为
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        // 更新 ScrollTrigger
        lenis.on('scroll', (e) => {
            ScrollTrigger.update();
        });

        // 添加 RAF 循环
        const tickerCallback = (time) => {
            lenis.raf(time * 1000);
        };

        gsap.ticker.add(tickerCallback);
        gsap.ticker.lagSmoothing(0);

        // 添加错误处理
        window.addEventListener('error', (e) => {
            console.error('Lenis error:', e);
            if (lenis) {
                lenis.destroy();
            }
        });

        // 返回清理函数
        return () => {
            if (lenis) {
                lenis.destroy();
                gsap.ticker.remove(tickerCallback);
            }
        };
    } catch (error) {
        console.error('Error initializing Lenis:', error);
        return () => { };
    }
}




function customCursor() {
    let cursorItem = document.querySelector(".cursor");
    if (!cursorItem) {
        return () => { }; // Return empty cleanup if no cursor element exists
    }

    let cursorParagraph = cursorItem.querySelector("p");
    let targets = document.querySelectorAll("[data-cursor]");
    let xOffset = 6;
    let yOffset = 50;
    let cursorIsOnRight = false;
    let currentTarget = null;
    let lastText = '';

    // Position cursor relative to actual cursor position on page load
    gsap.set(cursorItem, { xPercent: xOffset, yPercent: yOffset });

    // Use GSAP quick.to for a more performative tween on the cursor
    let xTo = gsap.quickTo(cursorItem, "x", { ease: "power3" });
    let yTo = gsap.quickTo(cursorItem, "y", { ease: "power3" });

    // Create the mousemove handler
    const mouseMoveHandler = (e) => {
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
        let scrollY = window.scrollY;
        let cursorX = e.clientX;
        let cursorY = e.clientY + scrollY;

        // Default offsets
        let xPercent = xOffset;
        let yPercent = yOffset;

        // Adjust X offset if in the rightmost 19% of the window
        if (cursorX > windowWidth * 0.66) {
            cursorIsOnRight = true;
            xPercent = -100;
        } else {
            cursorIsOnRight = false;
        }

        // Adjust Y offset if in the bottom 10% of the current viewport
        if (cursorY > scrollY + windowHeight * 0.9) {
            yPercent = -120;
        }

        if (currentTarget) {
            let newText = currentTarget.getAttribute("data-cursor");
            if (currentTarget.hasAttribute("data-easteregg") && cursorIsOnRight) {
                newText = currentTarget.getAttribute("data-easteregg");
            }

            if (newText !== lastText) {
                cursorParagraph.innerHTML = newText;
                lastText = newText;
            }
        }

        gsap.to(cursorItem, { xPercent: xPercent, yPercent: yPercent, duration: 0.9, ease: "power3" });
        xTo(cursorX);
        yTo(cursorY - scrollY);
    };

    // Create the mouseenter handlers
    const mouseEnterHandlers = new Map();
    targets.forEach(target => {
        const handler = () => {
            currentTarget = target;

            let newText = target.hasAttribute("data-easteregg")
                ? target.getAttribute("data-easteregg")
                : target.getAttribute("data-cursor");

            if (newText !== lastText) {
                cursorParagraph.innerHTML = newText;
                lastText = newText;
            }
        };

        mouseEnterHandlers.set(target, handler);
        target.addEventListener("mouseenter", handler);
    });

    // Add event listeners
    window.addEventListener("mousemove", mouseMoveHandler);

    // Return cleanup function
    return () => {
        // Remove mousemove listener
        window.removeEventListener("mousemove", mouseMoveHandler);

        // Remove all mouseenter listeners
        mouseEnterHandlers.forEach((handler, target) => {
            target.removeEventListener("mouseenter", handler);
        });

        // Reset cursor state
        if (cursorItem) {
            gsap.set(cursorItem, { clearProps: "all" });
        }

        // Clear GSAP tweens
        if (xTo && xTo.kill) xTo.kill();
        if (yTo && yTo.kill) yTo.kill();

        // Clear variables
        currentTarget = null;
        lastText = '';
    };
}



function scrollTextReveal() {
    let windowWidth = window.outerWidth;
    const splitInstances = [];
    const timelines = [];
    let resizeHandler;

    function cleanupCurrentAnimations() {
        // 清除現有的文字分割和動畫
        splitInstances.forEach(split => split.revert());
        timelines.forEach(tl => {
            if (tl.scrollTrigger) {
                tl.scrollTrigger.kill();
            }
            tl.kill();
        });

        // 清空陣列
        splitInstances.length = 0;
        timelines.length = 0;

        // 移除所有 wrapper
        document.querySelectorAll('.lines-wrap').forEach(wrapper => {
            const parent = wrapper.parentNode;
            while (wrapper.firstChild) {
                parent.insertBefore(wrapper.firstChild, wrapper);
            }
            wrapper.remove();
        });
    }

    function createSplits() {
        document.querySelectorAll("[split-type='text']").forEach(function (myText) {
            const mySplitText = new SplitText(myText, {
                type: "lines",
                linesClass: "split-lines"
            });
            splitInstances.push(mySplitText);

            document.querySelectorAll(".split-lines").forEach(function (line) {
                if (!line.parentNode.classList.contains("lines-wrap")) {
                    let wrapper = document.createElement('div');
                    wrapper.className = 'lines-wrap overflow-clip';
                    line.parentNode.insertBefore(wrapper, line);
                    wrapper.appendChild(line);
                }
            });
        });
    }

    function createAnimations() {
        document.querySelectorAll("[split-type='line']").forEach(function (triggerElement) {
            let myText = triggerElement.querySelector("[split-type='text']");
            let targetElement = triggerElement.querySelectorAll(".split-lines");
            const delayStr = myText.getAttribute("delay");
            const delay = parseFloat(myText.getAttribute("delay")) || 0;
            const scrollTime = parseFloat(myText.getAttribute("scroll-duration")) || 0.5;
            const scrollStagger = parseFloat(myText.getAttribute("scroll-stagger")) || 0.04;

            let tl = gsap.timeline({
                scrollTrigger: {
                    trigger: triggerElement,
                    start: "top bottom",
                    end: "bottom center",
                    toggleActions: "play none none reverse",
                    scrub: 1,
                }
            });

            tl.from(targetElement, {
                yPercent: 100,
                delay: delay,
                skewX: 2,
                duration: scrollTime,
                ease: 'Sine.easeOut',
                stagger: {
                    each: scrollStagger,
                    from: 0
                }
            });

            timelines.push(tl);
        });
    }

    function initializeTextAnimations() {
        createSplits();
        createAnimations();
    }

    initializeTextAnimations();

    // 處理 resize
    resizeHandler = function () {
        if (window.outerWidth !== windowWidth) {
            cleanupCurrentAnimations();
            initializeTextAnimations();
            windowWidth = window.outerWidth;
        }
    };

    window.addEventListener("resize", resizeHandler);

    // 返回清理函數
    return () => {
        cleanupCurrentAnimations();
        window.removeEventListener("resize", resizeHandler);
    };
}



function marqueeAnimation() {
    // 存儲所有的 tween 和 ResizeObserver
    const animations = new Map();

    // 選擇所有的 marquee 元素
    const marquees = document.querySelectorAll('[wb-data="marquee"]');

    if (!marquees.length) {
        return () => { };
    }

    function setupMarquee(marquee) {
        const duration = parseInt(marquee.getAttribute("duration"), 10) || 5;
        const marqueeContent = marquee.firstElementChild;

        if (!marqueeContent) {
            console.warn('Marquee content element not found');
            return null;
        }

        // 創建並添加克隆元素
        const marqueeContentClone = marqueeContent.cloneNode(true);
        marquee.append(marqueeContentClone);

        function playMarquee() {
            let currentAnimation = animations.get(marquee);
            let progress = currentAnimation?.tween ? currentAnimation.tween.progress() : 0;

            // 如果存在之前的動畫，先清除
            if (currentAnimation?.tween) {
                currentAnimation.tween.progress(0).kill();
            }

            const width = parseInt(
                getComputedStyle(marqueeContent).getPropertyValue("width"),
                10
            );
            const gap = parseInt(
                getComputedStyle(marqueeContent).getPropertyValue("column-gap"),
                10
            );
            const distanceToTranslate = -1 * (gap + width);

            const tween = gsap.fromTo(
                marquee.children,
                { x: 0 },
                { x: distanceToTranslate, duration, ease: "none", repeat: -1 }
            );

            tween.progress(progress);

            return tween;
        }

        // 創建 ResizeObserver
        const resizeObserver = new ResizeObserver(() => {
            const newTween = playMarquee();
            animations.set(marquee, {
                tween: newTween,
                observer: resizeObserver,
                clone: marqueeContentClone
            });
        });

        // 開始觀察
        resizeObserver.observe(marqueeContent);

        // 初始播放
        const initialTween = playMarquee();

        // 儲存這個 marquee 的相關物件
        animations.set(marquee, {
            tween: initialTween,
            observer: resizeObserver,
            clone: marqueeContentClone
        });
    }

    // 設置所有 marquee
    marquees.forEach(setupMarquee);

    // 返回清理函數
    return () => {
        animations.forEach(({ tween, observer, clone }) => {
            if (tween) {
                tween.kill();
            }
            observer.disconnect();
            clone.remove();
        });
        animations.clear();
    };
}


function textLinkAnimation() {
    let windowWidth = window.innerWidth;
    const splitInstances = [];
    const timelines = [];
    const eventListeners = [];
    let resizeHandler;

    function cleanupCurrentAnimations() {
        // Clean up split instances
        splitInstances.forEach(split => {
            if (split && typeof split.revert === 'function') {
                split.revert();
            }
        });

        // Clean up timelines
        timelines.forEach(tl => {
            if (tl) {
                tl.kill();
            }
        });

        // Remove event listeners
        eventListeners.forEach(({ element, listeners }) => {
            element.removeEventListener("mouseenter", listeners.mouseenter);
            element.removeEventListener("mouseleave", listeners.mouseleave);
        });

        // Clear arrays
        splitInstances.length = 0;
        timelines.length = 0;
        eventListeners.length = 0;
    }

    function createSplits() {
        // 將 [stagger-link] 的文字分割為 words 和 chars
        document.querySelectorAll('[stagger-link]').forEach(el => {
            const split = new SplitText(el, {
                type: 'words,chars',
                wordsClass: 'word',
                charsClass: 'char'
            });
            splitInstances.push(split);
        });
        // 將 [hoverstagger='text'] 的文字分割為 words 和 chars
        document.querySelectorAll("[hoverstagger='text']").forEach(el => {
            const split = new SplitText(el, {
                type: 'words,chars',
                wordsClass: 'word',
                charsClass: 'char'
            });
            splitInstances.push(split);
        });
    }

    function createAnimations() {
        // Select all elements with attribute [hoverstagger='link']
        document.querySelectorAll("[hoverstagger='link']").forEach((element, index) => {
            const text1 = element.querySelectorAll("[hoverstagger='text']")[0];
            const text2 = element.querySelectorAll("[hoverstagger='text']")[1];

            if (!text1 || !text2) return;  // Skip if required elements are missing

            const stagger = parseFloat(element.getAttribute("stagger")) || 0.03;
            const duration = parseFloat(element.getAttribute("duration")) || 0.3;

            const tl = gsap.timeline({
                paused: true,
                defaults: {
                    duration: 0.5,
                    ease: "power1.out"
                }
            });

            tl.to(text1.querySelectorAll(".char"), {
                scaleY: 0,
                yPercent: -100,
                duration: duration,
                stagger: { each: stagger }
            });

            tl.from(text2.querySelectorAll(".char"), {
                scaleY: 0,
                yPercent: 20,
                duration: duration,
                stagger: { each: stagger }
            }, 0);

            // Store timeline for cleanup
            timelines.push(tl);

            // Create event listeners
            const mouseenterHandler = () => tl.play();
            const mouseleaveHandler = () => tl.reverse();

            // Add event listeners
            element.addEventListener("mouseenter", mouseenterHandler);
            element.addEventListener("mouseleave", mouseleaveHandler);

            // Store event listeners for cleanup
            eventListeners.push({
                element,
                listeners: {
                    mouseenter: mouseenterHandler,
                    mouseleave: mouseleaveHandler
                }
            });
        });
    }

    function initializeTextAnimations() {
        createSplits();
        createAnimations();
    }

    initializeTextAnimations();

    // Handle resize
    resizeHandler = function () {
        if (window.innerWidth !== windowWidth) {
            cleanupCurrentAnimations();
            initializeTextAnimations();
            windowWidth = window.innerWidth;
        }
    };

    window.addEventListener("resize", resizeHandler);

    // Return cleanup function
    return () => {
        cleanupCurrentAnimations();
        window.removeEventListener("resize", resizeHandler);
    };
}

function scrollOutroAnimation() {
    let windowWidth = window.outerWidth;
    const timelines = [];
    let resizeHandler;

    function cleanupCurrentAnimations() {
        // 清除現有的動畫
        timelines.forEach(tl => {
            if (tl.scrollTrigger) {
                tl.scrollTrigger.kill();
            }
            tl.kill();
        });

        // 清空陣列
        timelines.length = 0;
    }

    function createAnimations() {
        const outroWrap = document.querySelector(".outro-wrap");
        if (!outroWrap) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: outroWrap,
                start: "top bottom",
                end: "+=400",
                scrub: 1,
            },
        });

        tl.to(".kv-bottom", {
            opacity: 0,
            duration: 0.5,
            ease: "power1.out"
        });


        timelines.push(tl);
    }

    function initializeAnimations() {
        createAnimations();
    }

    // 初始化動畫
    initializeAnimations();

    // 處理 resize
    resizeHandler = function () {
        if (window.outerWidth !== windowWidth) {
            cleanupCurrentAnimations();
            initializeAnimations();
            windowWidth = window.outerWidth;
        }
    };

    window.addEventListener("resize", resizeHandler);

    // 返回清理函數
    return () => {
        cleanupCurrentAnimations();
        window.removeEventListener("resize", resizeHandler);
    };
}

function aboutPopupAnimation() {
    const toggleButtons = document.querySelectorAll(".aboutrigger");
    const aboutWrap = document.querySelector(".about_wrap");
    const aboutContain = document.querySelector(".about_contain");
    const closeButton = document.querySelector(".about-close");
    let isOpen = false;
    let outsideClickHandler = null;

    if (!toggleButtons.length || !aboutWrap || !aboutContain) {
        return () => { };
    }

    const aboutTl = gsap.timeline({ paused: true });
    aboutTl.set(aboutWrap, { display: "flex" });

    aboutTl.to(aboutWrap, {
        opacity: 1,
        duration: 0.3,
        ease: "power3.inOut",
    });
    aboutTl.from(aboutContain, {
        xPercent: 150,
        yPercent: 30,
        rotateZ: -10,
        duration: 0.8,
        ease: "power3.out",
    }, 0.3);


    function openPopup() {
        aboutTl.play();
        isOpen = true;
        // 綁定點擊外部關閉
        document.addEventListener("mousedown", outsideClickHandler);
    }
    function closePopup() {
        aboutTl.reverse();
        isOpen = false;
        document.removeEventListener("mousedown", outsideClickHandler);
    }

    // 點擊 about_wrap 或關閉按鈕時關閉
    outsideClickHandler = function (e) {
        if (
            (aboutWrap && e.target === aboutWrap) ||
            (closeButton && closeButton.contains(e.target))
        ) {
            closePopup();
        }
    };

    // 綁定所有觸發按鈕
    const toggleHandler = function () {
        if (isOpen) {
            closePopup();
        } else {
            openPopup();
        }
    };
    toggleButtons.forEach(btn => btn.addEventListener("click", toggleHandler));
    if (closeButton) closeButton.addEventListener("click", closePopup);

    // 返回清理函數
    return () => {
        aboutTl.kill();
        toggleButtons.forEach(btn => btn.removeEventListener("click", toggleHandler));
        if (closeButton) closeButton.removeEventListener("click", closePopup);
        document.removeEventListener("mousedown", outsideClickHandler);
        // 還原樣式
        gsap.set(aboutWrap, { clearProps: "all" });
        gsap.set(aboutContain, { clearProps: "all" });
    };
}



// 彈窗控制（帶 GSAP 動畫）
function eggModalAnimation() {
    const eggModal = document.getElementById('egg-modal');
    const eggModalContent = document.getElementById('egg-modal-content');
    const eggModalBtn = document.getElementById('egg-modal-btn');
    const eggModalClose = document.getElementById('egg-modal-close');
    const modalInner = eggModal ? eggModal.querySelector('.modal-inner') : null;
    let isOpen = false;
    let outsideClickHandler = null;
    let eggModalLink = null;

    if (!eggModal || !eggModalContent || !eggModalBtn || !eggModalClose || !modalInner) {
        return () => {};
    }

    // 建立 timeline
    const modalTl = gsap.timeline({ paused: true });
    modalTl.set(modalInner, { opacity: 0 });
    modalTl.set(modalInner, { opacity: 0, yPercent: 200, rotateZ: -10, });

    modalTl.to(modalInner, {
        opacity: 1,
        yPercent: 0,
        rotateZ: 0,
        duration: 0.6,
        ease: 'power3.out',
    });

    function openModal(link, content) {
        if (content) eggModalContent.innerHTML = content;
        eggModalLink = link || null;
        eggModalBtn.style.display = link ? '' : 'none';
        eggModal.style.display = 'flex'; // 直接設置
        modalTl.play();
        isOpen = true;
        document.addEventListener('mousedown', outsideClickHandler);
    }
    function closeModal() {
        modalTl.reverse();
        isOpen = false;
        document.removeEventListener('mousedown', outsideClickHandler);
    }
    modalTl.eventCallback('onReverseComplete', () => {
        eggModalLink = null;
        eggModal.style.display = 'none'; // 動畫結束才隱藏
    });

    // 點擊外部或關閉按鈕時關閉
    outsideClickHandler = function (e) {
        if ((eggModal && e.target === eggModal) || (eggModalClose && eggModalClose.contains(e.target))) {
            closeModal();
        }
    };
    if (eggModalClose) eggModalClose.addEventListener('click', closeModal);
    if (eggModal) eggModal.addEventListener('click', outsideClickHandler);

    // 彈窗按鈕點擊
    eggModalBtn.onclick = function() {
        if (eggModalLink) {
            window.open(eggModalLink, '_blank');
            closeModal();
        }
    };

    // 返回清理函數
    return {
        openModal,
        closeModal,
        cleanup: () => {
            modalTl.kill();
            if (eggModalClose) eggModalClose.removeEventListener('click', closeModal);
            if (eggModal) eggModal.removeEventListener('click', outsideClickHandler);
            document.removeEventListener('mousedown', outsideClickHandler);
            gsap.set(eggModal, { clearProps: 'all' });
            gsap.set(modalInner, { clearProps: 'all' });
        }
    };
}

// eggModal 彈窗動畫實例
const eggModalInstance = eggModalAnimation();

function draggableFoldersEasterEgg() {
    // 確保 Draggable 和 InertiaPlugin 已經註冊
    if (typeof Draggable === "undefined" || typeof InertiaPlugin === "undefined") {
        console.error("Draggable 或 InertiaPlugin 未加載");
        return () => {};
    }

    let clampRotation = gsap.utils.clamp(-20, 20);

    class DraggableFolder {
        constructor(folder) {
            // 記錄初始位置
            this.initialX = gsap.getProperty(folder, "x") || 0;
            this.initialY = gsap.getProperty(folder, "y") || 0;
            // 不再建立 proxy，直接拖 folder
            const self = this;

            // 新增一個屬性記錄目前是否覆蓋
            this.isOverEgg = false;

            // 新增縮放方法
            this.updateEggTriggerScale = function(isOver) {
                const eggTrigger = document.querySelector('.egg-trigger');
                if (!eggTrigger) return;
                if (isOver) {
                    gsap.to(eggTrigger, { scale: 1.2, duration: 0.2, overwrite: true });
                } else {
                    gsap.to(eggTrigger, { scale: 1, duration: 0.2, overwrite: true });
                }
            };

            this.drag = Draggable.create(folder, {
                type: "x,y",
                bounds: ".drag-area",
                edgeResistance: 0.4,
                onPressInit() {
                    // 無需 proxy，無需 align
                },
                onPress() {
                    // 可選：folder.style.zIndex = 1000;
                },
                onDrag: () => {
                    // 判斷是否覆蓋
                    folder.classList.add('dragging');
                    const eggTrigger = document.querySelector('.egg-trigger');
                    if (eggTrigger) {
                        const isOver = this.drag.hitTest(eggTrigger, "50%");
                        if (isOver !== this.isOverEgg) {
                            this.updateEggTriggerScale(isOver);
                            this.isOverEgg = isOver;
                        }
                    }
                },
                onDragEnd() {
                    folder.classList.remove('dragging');
                },
                onThrowUpdate() {},
                onRelease: function() {
                    const eggTrigger = document.querySelector('.egg-trigger');
                    if (!eggTrigger) return;

                    const isOverEgg = this.hitTest(eggTrigger, "50%");

                    if (isOverEgg) {
                        this.disable();
                        gsap.to(eggTrigger, { scale: 1, duration: 0.2, overwrite: true });
                        if (folder.classList.contains('playlist')) {
                            showProjectModal('project3');
                        } else if (folder.classList.contains('cv')) {
                            eggModalInstance.openModal(
                                '/assets/profile/lao-le-resume.pdf',
                                'Download CV :)'
                            );
                        }
                        // 彈窗觸發時回到初始位置
                        gsap.to(folder, {
                            x: self.initialX,
                            y: self.initialY,
                            duration: 0.4,
                            ease: "power2.out",
                            onComplete: () => {
                                // 重新啟用 Draggable
                                this.enable();
                                
                                // 更新 Draggable 的內部狀態
                                this.x = self.initialX;
                                this.y = self.initialY;
                                this.endX = self.initialX;
                                this.endY = self.initialY;
                                this.startX = self.initialX;
                                this.startY = self.initialY;
                                
                                // 強制更新 Draggable 的狀態
                                if (typeof this.update === 'function') {
                                    this.update();
                                }
                                
                                // 確保元素的 transform 狀態正確
                                gsap.set(folder, {
                                    x: self.initialX,
                                    y: self.initialY,
                                    clearProps: "transform"
                                });
                                
                                // 重新設置 transform
                                gsap.set(folder, {
                                    x: self.initialX,
                                    y: self.initialY
                                });
                            }
                        });
                        return false;
                    }
                    // 拖曳結束時回復 scale
                    if (eggTrigger) {
                        gsap.to(eggTrigger, { scale: 1, duration: 0.2, overwrite: true });
                    }
                },
                inertia: true
            })[0];
        }
    }

    // 讓 .drag-area 內所有 .folders 都可拖曳
    let draggables = gsap.utils.toArray(".drag-area .folder").map(el => new DraggableFolder(el));

    // 返回清理函數
    return () => {
        draggables.forEach(d => {
            if (d.drag) d.drag.kill();
        });
    };
}

// ========== Project Modal 彈窗功能 ========== //

function createProjectModal() {
    // 建立彈窗 DOM 結構，加入左右箭頭
    let modal = document.createElement('div');
    modal.className = 'project-modal';
    modal.innerHTML = `
        <div class="project-modal-content">
            <p class="modal-hint">[ Scroll/Drag to Explore ]</p>
            <div class="arrow-wrap">
                <button class="project-modal-arrow project-modal-arrow-left" title="prev">&#8592; Prev</button>
                <button class="project-modal-arrow project-modal-arrow-right" title="next project">Next &#8594;</button>
            </div>
            <button class="project-modal-close close-btn"><p>×</p></button>
            <div class="project-container">
                <div class="project-modal-body"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

// 專門更新 project-modal-body 內容並做淡入淡出動畫
function updateProjectModalBody(projectKey) {
    if (!window.projectsData || !window.projectsData[projectKey]) return;
    const modal = document.querySelector('.project-modal');
    if (!modal) return;
    const data = window.projectsData[projectKey];
    const body = modal.querySelector('.project-modal-body');
    // 淡出動畫
    gsap.to(body, {
        opacity: 0, duration: 0.3, onComplete: () => {
            // 動態生成內容
            modal.dataset.presentation = data.presentation || 'project';
            modal.querySelector('.modal-hint').textContent = data.presentation === 'case-study' ? '[ SCROLL TO READ ]' : '[ SCROLL/DRAG TO EXPLORE ]';
            if (data.presentation === 'case-study') {
                if (window.projectModalSwiper) { window.projectModalSwiper.destroy(true, true); window.projectModalSwiper = null; }
                body.innerHTML = `<article class="case-reader" tabindex="0" aria-label="${data.title}完整作品集" data-lenis-prevent>
                    <header class="case-heading"><h2>${data.title}</h2><a href="${data.link}" target="_blank" rel="noopener noreferrer">${data.linkLabel}</a></header>
                    <div class="case-pages">${data.media.map((item,index)=>`<img src="${item.url}" srcset="${item.srcset || ''}" sizes="(max-width: 767px) 100vw, 1501px" width="${item.width}" height="${item.height}" alt="${item.alt}" loading="${index < 2 ? 'eager' : 'lazy'}" decoding="async">`).join('')}</div>
                    <p class="case-end">END / ${data.title}</p>
                </article>`;
                gsap.fromTo(body, { opacity: 0 }, { opacity: 1, duration: 0.3 });
                updateProjectModalArrows(projectKey);
                return;
            }
            const mediaItems = [data.cover, ...(data.media || [])].filter(Boolean);
            const mediaHtml = mediaItems.map((item, index) => {
                const ratio = Number(item.ratio) > 0 ? Number(item.ratio) : 4/3;
                const label = String(item.alt || '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
                const visual = item.type === 'video'
                    ? `<video src="${item.url}" autoplay loop muted playsinline class="project-modal-video"></video>`
                    : `<img src="${item.url}" srcset="${item.srcset || ''}" sizes="(max-width: 767px) 86vw, 900px" alt="${label}" class="project-modal-img" loading="${index < 2 ? 'eager' : 'lazy'}" decoding="async" data-swiper-parallax-x="10%">`;
                return `<div class="swiper-slide" style="--slide-ratio:${ratio}">${visual}${data.presentation === 'journal' ? `<p class="media-caption">${String(index+1).padStart(2,'0')} / ${label}</p>` : ''}</div>`;
            }).join('');
            body.innerHTML = `
            <div class="project-modal-media swiper-container">
                <div class="swiper-wrapper">${mediaHtml}</div>
            </div>
            <div class="project-modal-info">
                <h2 class="project-modal-title">${data.title}</h2>
                <p class="project-modal-desc">${data.description}</p>
                ${data.link ? `<a class="project-modal-live-btn" href="${data.link}" target="_blank" rel="noopener noreferrer">${data.linkLabel || 'Live site'}</a>` : ''}
            </div>
        `;
            // Swiper 重新初始化
            if (window.projectModalSwiper && window.projectModalSwiper.destroy) {
                window.projectModalSwiper.destroy(true, true);
            }
            const slideCount = body.querySelectorAll('.swiper-slide').length;
            window.projectModalSwiper = new Swiper('.project-modal-media .swiper-container, .project-modal-media.swiper-container', {
                slidesPerView: "auto",
                spaceBetween: 0,
                loop: false,
                loopedSlides: slideCount,
                speed: 600,
                mousewheel: {
                    releaseOnEdges: true,
                    sensitivity: 20,
                },
                keyboard: true,
            });
            // 淡入動畫
            gsap.fromTo(body, { opacity: 0 }, { opacity: 1, duration: 0.3 });
            // 更新箭頭狀態
            updateProjectModalArrows(projectKey);
        }
    });
}

// 更新左右箭頭狀態與事件
function updateProjectModalArrows(projectKey) {
    const modal = document.querySelector('.project-modal');
    if (!modal) return;
    const projectKeys = Object.keys(window.projectsData);
    const currentIdx = projectKeys.indexOf(projectKey);
    const leftArrow = modal.querySelector('.project-modal-arrow-left');
    const rightArrow = modal.querySelector('.project-modal-arrow-right');
    if (leftArrow) {
        leftArrow.disabled = currentIdx <= 0;
        leftArrow.style.opacity = currentIdx <= 0 ? '0.3' : '1';
        leftArrow.onclick = (e) => {
            e.stopPropagation();
            if (currentIdx > 0) {
                updateProjectModalBody(projectKeys[currentIdx - 1]);
            }
        };
    }
    if (rightArrow) {
        rightArrow.disabled = currentIdx >= projectKeys.length - 1;
        rightArrow.style.opacity = currentIdx >= projectKeys.length - 1 ? '0.3' : '1';
        rightArrow.onclick = (e) => {
            e.stopPropagation();
            if (currentIdx < projectKeys.length - 1) {
                updateProjectModalBody(projectKeys[currentIdx + 1]);
            }
        };
    }
}

// 彈窗事件註冊與移除
let projectModalEventHandlers = null;

function showProjectModal(projectKey) {
    if (!window.projectsData || !window.projectsData[projectKey]) return;
    let modal = document.querySelector('.project-modal');
    if (!modal) modal = createProjectModal();
    // 只在第一次開啟時做彈窗動畫
    if (modal.style.opacity !== '1') {
        // 先設為可見但透明，方便動畫
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.documentElement.setAttribute('data-lenis-prevent', 'true');
        // GSAP 進場動畫
        if (modal._gsapTimeline) {
            modal._gsapTimeline.kill();
            modal._gsapTimeline = null;
        }
        gsap.set(modal, { opacity: 0, pointerEvents: 'auto' });
        gsap.set('.project-modal-content', { clipPath: 'polygon(30% 50%, 70% 50%, 70% 50%, 30% 50%)' });
        gsap.set('.project-container', { opacity: 0, yPercent: 50 });
        // timeline
        const tl = gsap.timeline();
        tl.to(modal, { opacity: 1, duration: 0.25, ease: 'power2.out' });
        tl.fromTo('.project-modal-content',
            { clipPath: 'polygon(30% 50%, 70% 50%, 70% 50%, 30% 50%)' },
            { clipPath: 'polygon(30% 30%, 70% 30%, 70% 70%, 30% 70%)', duration: 0.6, ease: 'expo.inOut' }
        )
            .to('.project-modal-content',
                { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 1, ease: 'expo.inOut' }
            );
        tl.to('.project-container', { opacity: 1, yPercent: 0, stagger: 0.03, duration: 1, ease: 'expo.out' });
        modal._gsapTimeline = tl;
    }
    // 更新內容
    updateProjectModalBody(projectKey);

    // 註冊關閉事件（只在彈窗開啟時註冊）
    if (!projectModalEventHandlers) {
        const closeHandler = (e) => {
            if (
                e.target.closest('.project-modal-close') ||
                (e.target.classList.contains('project-modal') && e.target === document.querySelector('.project-modal'))
            ) {
                hideProjectModal();
            }
        };
        const escHandler = (e) => {
            if (e.key === 'Escape') hideProjectModal();
        };
        document.addEventListener('click', closeHandler);
        document.addEventListener('keydown', escHandler);
        projectModalEventHandlers = { closeHandler, escHandler };
    }
}

function hideProjectModal() {
    const modal = document.querySelector('.project-modal');
    if (modal) {
        if (modal._gsapTimeline) {
            // 反向播放動畫，動畫結束後再隱藏
            modal._gsapTimeline.reverse();
            modal._gsapTimeline.eventCallback('onReverseComplete', () => {
                modal.style.opacity = '0';
                modal.style.pointerEvents = 'none';
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
                document.documentElement.removeAttribute('data-lenis-prevent');
                // 移除事件
                if (projectModalEventHandlers) {
                    document.removeEventListener('click', projectModalEventHandlers.closeHandler);
                    document.removeEventListener('keydown', projectModalEventHandlers.escHandler);
                    projectModalEventHandlers = null;
                }
            });
        } else {
            modal.style.opacity = '0';
            modal.style.pointerEvents = 'none';
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.documentElement.removeAttribute('data-lenis-prevent');
            // 移除事件
            if (projectModalEventHandlers) {
                document.removeEventListener('click', projectModalEventHandlers.closeHandler);
                document.removeEventListener('keydown', projectModalEventHandlers.escHandler);
                projectModalEventHandlers = null;
            }
        }
    }
}

function setupProjectModalEvents() {
    // 只監聽 .card 點擊，點擊時才建立彈窗
    document.querySelectorAll('.card').forEach((card, idx) => {
        card.addEventListener('click', () => {
            // 假設 .card 有 data-project 屬性，否則用 project1, project2... 順序對應
            let key = card.getAttribute('data-project') || `project${idx + 1}`;
            showProjectModal(key);
        });
    });
}

// DOMContentLoaded 後初始化彈窗事件
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupProjectModalEvents);
} else {
    setupProjectModalEvents();
}



let mybutton = document.getElementById("topBtn");

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}
