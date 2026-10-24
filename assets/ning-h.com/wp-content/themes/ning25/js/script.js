// ========== ScriptManager 統一管理 ========== //

class ScriptManager {
    constructor() {
        this.cleanupFunctions = [];
        // Touch layouts use native scrolling and normal document flow.
        if (window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches) {
            document.documentElement.classList.add('simple-layout');
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            return;
        }
        // 初始化時禁用滾動（同時設置 html 和 body）
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        this.waitForFontsAndInit();
        // 懶加載 initSphereAnimation
        this.sphereAnimationInitialized = false;
        this.sphereAnimationCleanup = null;
        const canvasSection = document.querySelector('#canvas');
        if (canvasSection && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.sphereAnimationInitialized) {
                        this.sphereAnimationCleanup = initSphereAnimation();
                        this.sphereAnimationInitialized = true;
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.1 });
            observer.observe(canvasSection);
        } else if (canvasSection) {
            // 不支援IntersectionObserver時，直接初始化
            this.sphereAnimationCleanup = initSphereAnimation();
            this.sphereAnimationInitialized = true;
        }
    }

    waitForFontsAndInit() {
        // 直接初始化，不等待字体
        this.init();
    }

    init() {
        this.initializeAnimations();
    }

    initializeAnimations() {
        const cleanups = [
            initPreloaderAnimation(),
            initHeaderScrollAnimation(),
            initCubeScrollAnimation(),
            initSticky2Animation(),
            initFixedElementEffects(),
            // utility.js 的動畫
            marqueeAnimation(),
            scrollTextReveal(),
            scrollOutroAnimation(),
            textLinkAnimation(),
            // draggableFoldersEasterEgg(), // 移除原本直接初始化
        ];

        // 懶加載 draggableFoldersEasterEgg
        this.draggableFoldersEasterEggInitialized = false;
        this.draggableFoldersEasterEggCleanup = null;
        const dragArea = document.querySelector('.drag-area');
        if (dragArea && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.draggableFoldersEasterEggInitialized) {
                        this.draggableFoldersEasterEggCleanup = draggableFoldersEasterEgg();
                        this.draggableFoldersEasterEggInitialized = true;
                        // 註冊清理
                        if (typeof this.draggableFoldersEasterEggCleanup === 'function') {
                            window.animationManager.register(this.draggableFoldersEasterEggCleanup);
                            this.cleanupFunctions.push(this.draggableFoldersEasterEggCleanup);
                        }
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.1 });
            observer.observe(dragArea);
        } else if (dragArea) {
            // 不支援IntersectionObserver時，直接初始化
            this.draggableFoldersEasterEggCleanup = draggableFoldersEasterEgg();
            this.draggableFoldersEasterEggInitialized = true;
            if (typeof this.draggableFoldersEasterEggCleanup === 'function') {
                window.animationManager.register(this.draggableFoldersEasterEggCleanup);
                this.cleanupFunctions.push(this.draggableFoldersEasterEggCleanup);
            }
        }

        cleanups.forEach(fn => {
            if (typeof fn === 'function') {
                window.animationManager.register(fn);
                this.cleanupFunctions.push(fn);
            }
        });
    }

    cleanup() {
        this.cleanupFunctions.forEach(fn => fn());
        this.cleanupFunctions = [];
        window.animationManager.destroy();
        // 在cleanup()裡加上清理
        if (this.sphereAnimationCleanup) {
            this.sphereAnimationCleanup();
            this.sphereAnimationCleanup = null;
            this.sphereAnimationInitialized = false;
        }
    }
}

// 修改初始化时机
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
        if (!window.scriptManager) {
            window.scriptManager = new ScriptManager();
        }
    });
} else {
    setTimeout(() => {
        if (!window.scriptManager) {
            window.scriptManager = new ScriptManager();
        }
    }, 200);
}

let aboutPopupCleanup = null;
let aboutPopupInitialized = false;

function lazyInitAboutPopupAnimation() {
    if (!aboutPopupInitialized) {
        aboutPopupCleanup = aboutPopupAnimation();
        aboutPopupInitialized = true;
    }
}

// 綁定所有 aboutrigger 按鈕的首次點擊事件
document.querySelectorAll('.aboutrigger').forEach(btn => {
    btn.addEventListener('click', function handler(e) {
        lazyInitAboutPopupAnimation();
        // 初始化後，移除這個一次性 handler，讓後續點擊交給 aboutPopupAnimation 自己的邏輯
        btn.removeEventListener('click', handler);
        // 觸發一次點擊，讓彈窗馬上出現
        btn.click();
    });
});

// ========== 動畫區塊函數 ========== //

function initPreloaderAnimation() {

    let handleResize;
    const ctx = gsap.context(() => {
        let preloadTl = gsap.timeline({
            defaults: {
                duration: 2, ease: 'expo.inOut',
            }
        });
        gsap.set('.header', { autoAlpha: 1 });
        gsap.set('.cube', { autoAlpha: 1, opacity: 1, });
        gsap.set('.load-reveal', { autoAlpha: 1, });
        preloadTl.set('.load-leave', { autoAlpha: 1, yPercent: 100, });
    
    
        let customEase =
            "M0,0,C0,0,0.13,0.34,0.238,0.442,0.305,0.506,0.322,0.514,0.396,0.54,0.478,0.568,0.468,0.56,0.522,0.584,0.572,0.606,0.61,0.719,0.714,0.826,0.798,0.912,1,1,1,1";
        let counter = {
            value: 0
        };
        let loaderDuration = 3;
        // 如果不是第一次訪問，縮短動畫時間並從 75 開始
        if (sessionStorage.getItem("visited") !== null) {
            loaderDuration = 2;
            counter = {
                value: 75
            };
        }
        sessionStorage.setItem("visited", "true");
        function updateLoaderText() {
            let progress = Math.round(counter.value);
            const loaderNumber = document.querySelector(".loader_number");
            if (loaderNumber) {
                loaderNumber.textContent = progress;
            }
        }
    
        const left = document.querySelector('.loader-left');
        const right = document.querySelector('.loader-right');
        const padding = 32; // px
    
        // left: 目標是 left = 32px
        const leftRect = left.getBoundingClientRect();
        const leftTargetX = padding - leftRect.left;
    
        // right: 目標是 right = 32px
        const rightRect = right.getBoundingClientRect();
        const rightTargetX = window.innerWidth - rightRect.right - padding;
    
    
    
        preloadTl.set('svg path, .title-wrap svg text', {
            yPercent: -120,
        });
    
        preloadTl.set('.load-reveal', {
            opacity: 0,
            yPercent: 100,
        });
    
    
        preloadTl.to('.load-leave', {
            yPercent: 0,
            duration: 1,
            delay: 1,
            ease: 'expo.out',
        });
    
        preloadTl.to(counter, {
            value: 100,
            onUpdate: updateLoaderText,
            duration: loaderDuration,
            ease: CustomEase.create("custom", customEase)
        }, 1);
    
        preloadTl.to(left, {
            x: leftTargetX,
            duration: loaderDuration,
            ease: CustomEase.create("custom", customEase),
        }, 1.4);
    
        preloadTl.to(right, {
            x: rightTargetX,
            duration: loaderDuration,
            ease: CustomEase.create("custom", customEase),
        }, 1.4);
    
        preloadTl.to('.load-leave', {
            yPercent: -100,
            duration: 1,
            ease: 'expo.out',
            delay: 0.1,
        });
    
        preloadTl.to('svg path, .title-wrap svg text', {
            yPercent: 0,
            duration: 1,
            ease: 'expo.out',
            stagger: 0.03,
            delay: -1,
        });
    
        preloadTl.to('.load-reveal', {
            opacity: 1,
            yPercent: 0,
            duration: 1,
            ease: 'expo.out',
            stagger: 0.03,
            delay: -1.4,
        });
    
        preloadTl.to('.loader-bg', {
            yPercent: -20,
            duration: 1.2,
            delay: -1.4,
            ease: 'expo.out',
            onComplete: () => {
                gsap.set('.preloader', {
                    display: 'none',
                });
    
                gsap.set('.loader-bg', {
                    display: 'none',
                });
    
                gsap.set('.home-clone-element', { display: 'block' });
    
                // 動畫結束後恢復滾動
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
                const lenisCleanup = lenisInitialize();
                if (typeof lenisCleanup === 'function') {
                    window.animationManager.register(lenisCleanup);
                    if (window.scriptManager && window.scriptManager.cleanupFunctions) {
                        window.scriptManager.cleanupFunctions.push(lenisCleanup);
                    }
                }
            }
        });


    });
    

    return () => {
        ctx.revert();
        if (handleResize) {
            window.removeEventListener('resize', handleResize);
        }
    };


}

function initSphereAnimation() {
    let camera, renderer, uniforms, scene, sphere;
    let composer;
    let targetRotation = -0.8;
    let currentRotation = -0.8;
    const rotationSpeed = 0.05;
    const maxRotation = 0.4;
    let animationFrameId;

    function initPost() {
        composer = new THREE.EffectComposer(renderer);
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);
        const effect1 = new THREE.ShaderPass(DotScreenShader);
        effect1.uniforms['scale'].value = 4;
        composer.addPass(effect1);
    }

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 1000);
        camera.position.set(0, 0, 1);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xeeeeee, 1);
        renderer.physicallyCorrectLights = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
        document.body.appendChild(renderer.domElement);

        uniforms = {
            uTime: { value: 0.0 },
            resolution: { value: new THREE.Vector4() }
        };

        const material = new THREE.ShaderMaterial({
            extensions: {
                derivatives: "#extension GL_OES_standard_derivatives : enable"
            },
            side: THREE.DoubleSide,
            uniforms,
            vertexShader: `
                uniform float uTime;
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform vec2 pixels;
                float PI = 3.141592653589793238;  
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float progress;
                uniform sampler2D texture1;
                uniform sampler2D texture2;
                uniform vec2 resolution;
                varying vec2 vUv;
                varying vec3 vPosition;
                float PI = 3.141592653589793238;    

                float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
                vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
                vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

                float noise(vec3 p){
                    vec3 a = floor(p);
                    vec3 d = p - a;
                    d = d * d * (3.0 - 2.0 * d);

                    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
                    vec4 k1 = perm(b.xyxy);
                    vec4 k2 = perm(k1.xyxy + b.zzww);

                    vec4 c = k2 + a.zzzz;
                    vec4 k3 = perm(c);
                    vec4 k4 = perm(c + 1.0);

                    vec4 o1 = fract(k3 * (1.0 / 41.0));
                    vec4 o2 = fract(k4 * (1.0 / 41.0));

                    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
                    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

                    return o4.y * d.y + o4.x * (1.0 - d.y);
                }

                float lines(vec2 uv, float offset){
                    return smoothstep(
                    0., 0.9 + offset*0.5, 
                    abs(0.5*(sin(uv.x*20.) + offset*2.))
                    );
                }

                mat2 rotate2d(float angle){
                    return mat2(
                        cos(angle), -sin(angle),
                        sin(angle), cos(angle)
                    );
                }

                void main() {
                    float n = noise(vPosition + uTime * 1.5);
                    vec3 baseSecond = vec3(200./255., 197./255., 192./255.);
                    vec3 baseFirst = vec3(62./255., 74./255., 112./255.);
                    vec3 accent = vec3(0./255., 0./255., 0./255.);   
                    vec3 baseThird = vec3(237./255., 108./255., 0./255.);
                    
                    vec2 baseUV = rotate2d(n) * vPosition.xy*0.15;
                    float basePattern = lines(baseUV, 0.2);
                    float secondPattern = lines(baseUV, 0.3);
                    vec3 baseColor = mix(baseSecond, baseFirst, basePattern);
                    vec3 secondBaseColor = mix(baseColor, accent, secondPattern);

                    gl_FragColor = vec4(vec3(secondBaseColor), 1.);
                } 
            `
        });

        const geometry = new THREE.SphereGeometry(1.5, 32, 32);
        sphere = new THREE.Mesh(geometry, material);
        sphere.rotation.y = -0.8;
        scene.add(sphere);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('resize', resize);
        resize();
    }

    function onMouseMove(event) {
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        targetRotation = -0.8 + mouseX * maxRotation;
    }

    function resize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (composer) {
            composer.setSize(window.innerWidth, window.innerHeight);
        }
        uniforms.resolution.value.x = window.innerWidth;
        uniforms.resolution.value.y = window.innerHeight;
        uniforms.resolution.value.z = window.devicePixelRatio;
    }

    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        currentRotation += (targetRotation - currentRotation) * rotationSpeed;
        sphere.rotation.y = currentRotation;
        uniforms.uTime.value += 0.01;
        composer.render();
    }

    init();
    initPost();
    animate();

    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', resize);
        if (renderer && renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
    };
}

function initHeaderScrollAnimation() {

    let handleResize;
    const ctx = gsap.context(() => {
        const kvTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".header-bg",
                start: "top top",
                end: "+=300vh",
                scrub: 1,
            }
        });
    
        kvTl.to(".header-bg", {
            yPercent: -100,
            ease: "none",
        });
    
        kvTl.to(".info-title", {
            yPercent: -100,
            ease: "expo.out",
        }, 0);
    
        kvTl.to(".header-info", {
            yPercent: -200,
            ease: "expo.out",
        }, 0);

    });
    

    return () => {
        ctx.revert();
        if (handleResize) {
            window.removeEventListener('resize', handleResize);
        }
    };

}


function initCubeScrollAnimation() {

    let handleResize;
    const ctx = gsap.context(() => {
        const stickySection = document.querySelector(".sticky");
    const logo = document.querySelector(".square");
    const cubesContainer = document.querySelector(".cubes");
    const cubes = document.querySelectorAll('.cube');
    let stickyHeight = window.innerHeight * 4;
    const interpolate = (start, end, progress) => start + (end - start) * progress;

    const mainTl = gsap.timeline({
        scrollTrigger: {
            trigger: stickySection,
            start: "top top",
            end: () => `+=${stickyHeight}px`,
            scrub: 0.5,
            pin: true,
            pinSpacing: true,
            onUpdate: (self) => {
                const progress = self.progress;

                const initialProgress = Math.min(progress * 20, 1);
                logo.style.filter = `blur(${interpolate(0, 20, initialProgress)}px)`;

                const logoOpacityProgress = progress >= 0.02 ? Math.min((progress - 0.02) * 100, 1) : 0;
                logo.style.opacity = 1 - logoOpacityProgress;

                const cubesOpacityProgress = progress >= 0.01 ? Math.min((progress - 0.01) * 100, 1) : 0;
                cubesContainer.style.opacity = cubesOpacityProgress;

                // 标题动画
                const titleProgress = Math.min(Math.max(0, (progress - 0.25) * 2), 1); // 从 20% 进度开始
                gsap.set(".cube-title", {
                    opacity: titleProgress,
                    ease: "power2.out"
                });

                // 标题文字动画
                const textProgress = Math.min(Math.max(0, (progress - 0.3) * 2), 1); // 从 30% 进度开始
                gsap.set(".cube-title-txt", {
                    yPercent: -75 * textProgress,
                    ease: "power2.inOut"
                });

                // Cubes 动画
                const firstPhaseProgress = Math.min(progress * 2, 1);
                const secondPhaseProgress = progress >= 0.5 ? (progress - 0.5) * 2 : 0;

                cubes.forEach((cube) => {
                    const initial = JSON.parse(cube.getAttribute('data-initial'));
                    const final = JSON.parse(cube.getAttribute('data-final'));

                    const currentTop = interpolate(initial.top, final.top, firstPhaseProgress);
                    const currentLeft = interpolate(initial.left, final.left, firstPhaseProgress);
                    const currentRotateX = interpolate(initial.rotateX, final.rotateX, firstPhaseProgress);
                    const currentRotateY = interpolate(initial.rotateY, final.rotateY, firstPhaseProgress);
                    const currentRotateZ = interpolate(initial.rotateZ, final.rotateZ, firstPhaseProgress);
                    const currentScale = interpolate(initial.scale, final.scale, firstPhaseProgress);
                    const currentZ = interpolate(initial.z, final.z, firstPhaseProgress);
                    let additionalRotation = interpolate(0, 360, secondPhaseProgress);

                    cube.style.top = `${currentTop}%`;
                    cube.style.left = `${currentLeft}%`;
                    cube.style.scale = `${currentScale}`;
                    cube.style.transform = `
                        translate3d(-50%, -50%, ${currentZ}px)
                        rotateX(${currentRotateX}deg)
                        rotateY(${currentRotateY + additionalRotation}deg)
                        rotateZ(${currentRotateZ}deg)
                    `;
                });
            },
        }
    });


    });
    

    return () => {
        ctx.revert();
        if (handleResize) {
            window.removeEventListener('resize', handleResize);
        }
    };
    
}

function initSticky2Animation() {
    const ctx = gsap.context(() => {
        const CARD_ANIM_END = 0.8;
        const TEXT_ANIM_START = 0.75;
        const sticky2Section = document.querySelector(".sticky2");
        const stickyHeader = document.querySelector(".sticky-header");
        const cards = gsap.utils.toArray(".card");
        

        let split, splitTitle;

        function refreshSplits() {
            if (split) split.revert();
            if (splitTitle) splitTitle.revert();

            split = new SplitText(".service-wrap h3", {
                type: "lines",
                linesClass: "lines-wrap",
            });
            splitTitle = new SplitText(".desc-wrap h1", {
                type: "chars",
                linesClass: "chars-wrap",
            });

            gsap.set(split.lines, { yPercent: 100 });
            gsap.set(splitTitle.chars, { yPercent: 0 });
        }

        // --- 核心邏輯：建立一個與滾動條同步的 Timeline ---
        const mainTl = gsap.timeline({
            scrollTrigger: {
                trigger: sticky2Section,
                start: "top top",
                end: () => `+=${window.innerHeight * Math.max(2, cards.length * 0.8)}`,
                pin: true,
                scrub: 1, // 數值 1 增加平滑感，也可設為 true
                onUpdate: (self) => {
                    // Header 的位移依然放在這裡，因為它需要根據實時 progress 計算
                    if (stickyHeader) {
                        const maxTranslate = stickyHeader.offsetWidth - window.innerWidth;
                        gsap.set(stickyHeader, { x: -self.progress * maxTranslate });
                    }
                }
            }
        });

        // 1. 初始化文字與狀態
        if (document.fonts) {
            document.fonts.ready.then(() => {
                refreshSplits();
                buildTimeline();
            });
        } else {
            refreshSplits();
            buildTimeline();
        }

        function buildTimeline() {
            // 清除現有內容防止重複
            mainTl.clear();

            // A. 卡片動畫階段 (在 0 ~ 0.8 區間)
            // 由於卡片邏輯包含複雜的數組插值，我們用一個虛擬對象來驅動
            const cardObj = { prop: 0 };
            mainTl.to(cardObj, {
                prop: 1,
                duration: CARD_ANIM_END,
                ease: "none",
                onUpdate: () => {
                    const cardP = cardObj.prop;
                    const transforms = [
                        [[10, 50, -10, 10], [20, -10, -45, 20]],
                        [[0, 47.5, -10, 15], [-25, 15, -45, 30]],
                        [[0, 52.5, -10, 5], [15, -5, -40, 60]],
                        [[0, 50, 30, -80], [20, -10, 60, 5]],
                        [[0, 55, -15, 30], [25, -15, 60, 95]],
                    ];

                    cards.forEach((card, i) => {
                        const delay = cards.length > 1 ? i * 0.45 / (cards.length - 1) : 0;
                        const indP = Math.max(0, Math.min((cardP - delay) * 2, 1));
                        if (indP > 0) {
                            const [yPos, rots] = transforms[i];
                            const yProg = indP * 3;
                            const idx = Math.min(Math.floor(yProg), yPos.length - 2);
                            const ratio = yProg - idx;
                            gsap.set(card, {
                                xPercent: gsap.utils.interpolate(25, -650, indP),
                                yPercent: gsap.utils.interpolate(yPos[idx], yPos[idx + 1], ratio),
                                rotation: gsap.utils.interpolate(rots[idx], rots[idx + 1], ratio),
                                opacity: 1
                            });
                        } else {
                            gsap.set(card, { opacity: 0 });
                        }
                    });
                }
            }, 0);

            // B. 文字與背景動畫階段 (從 TEXT_ANIM_START 開始)
            const textStart = TEXT_ANIM_START;
            const duration = 1 - TEXT_ANIM_START;

            mainTl.addLabel("textPhase", textStart);
            gsap.set(".service-bg", { opacity: 0});     
            gsap.set(".service-wrap", { opacity: 0 });
            gsap.set(".service-img", { scale: 0,});
            gsap.set(".bottom-first", { opacity: 1 });
            gsap.set(".bottom-second", { opacity: 0,});
            gsap.set(".cross", { opacity: 1 });

            mainTl.to(splitTitle.chars, { 
                    yPercent: -100, 
                    stagger: 0.02, 
                    duration: duration * 0.5 
                    }, "textPhase")
                  .to(".service-bg", { opacity: 1, duration: duration * 0.5 }, "textPhase")
                  .to(".bottom-first", { opacity: 0, duration: duration * 0.3 }, "textPhase")
                  .to(".bottom-second", { opacity: 1, duration: duration * 0.3 }, "textPhase")
                  .to(".cross", { opacity: 0, duration: duration * 0.2 }, "textPhase")
                  .to(".service-wrap", { opacity: 1, duration: duration * 0.2 }, "textPhase+=0.2")
                  .to(split.lines, { 
                    yPercent: 0, 
                    stagger: 0.04, 
                    duration: duration * 0.7 
                }, "textPhase")
                  .to(".service-img", { 
                      scale: 1, 
                      ease: "power3.out", 
                      duration: duration * 0.2 
                  }, "textPhase+=0.2");
                  
        }
    });

    return () => ctx.revert();
}
function initFixedElementEffects() {

    
    // 添加元素存在性检查
    const fixedElements = document.querySelectorAll('[data-fixed]');
    const blocks = document.querySelectorAll('.content__inner');
    const navLinks = document.querySelectorAll('.text-link');
    const header = document.querySelector('.header');

    // 如果关键元素不存在，直接返回
    if (!fixedElements.length || !blocks.length || !navLinks.length || !header) {
        console.warn('FixedElementEffects: 部分必要元素未找到，动画将不会初始化');
        return () => { };
    }

    const defaultAnimationProps = { duration: 0.6, ease: 'power3' };

    const originalHTMLContent = new Map();
    const originalStyles = new Map();
    fixedElements.forEach(el => {
        originalHTMLContent.set(el, el.innerHTML);
        originalStyles.set(el, el.getAttribute('style') || '');
    });

    function resetElement(target) {
        target.innerHTML = originalHTMLContent.get(target);
        gsap.set(target, {
            clearProps: 'all',
            rotation: 0,
            xPercent: 0,
            yPercent: 0,
            x: 0,
            y: 0,
            scale: 1,
            autoAlpha: 1,
        });
        target.setAttribute('style', originalStyles.get(target));
    }

    function getElementTopOffset(element) {
        const elementRect = element.getBoundingClientRect();
        return elementRect.top;
    }

    const effects = [
        {
            offsetStartAmount: 30,
            offsetEndAmount: 10,
            onEnter: (target) => {
                if (target.currentTween) target.currentTween.kill();
                resetElement(target);
                gsap.set(target, { transformOrigin: '0% 0%' });
                target.currentTween = gsap.to(target, {
                    scale: window.innerWidth <= 768 ? 0.4 : 0.2,
                    ...defaultAnimationProps,
                    onStart: () => {
                        navLinks.forEach(link => link.classList.add('show'));
                        gsap.to(header, {
                            mixBlendMode: 'difference',
                            duration: 0.8,
                            ease: 'power3.out'
                        });
                        gsap.to(".kv-bottom", {
                            mixBlendMode: 'difference',
                            duration: 0.8,
                            ease: 'power3.out'
                        });
                    },
                    onComplete: () => {
                        target.currentTween = null;
                    }
                });
            },
            onLeave: (target) => {
                if (target.currentTween) target.currentTween.kill();
                target.currentTween = gsap.to(target, {
                    scale: 1,
                    autoAlpha: 1,
                    ...defaultAnimationProps,
                    onStart: () => {
                        navLinks.forEach(link => link.classList.remove('show'));
                        gsap.to(header, {
                            mixBlendMode: 'normal',
                            duration: 0.8,
                            ease: 'power3.out'
                        });
                        gsap.to(".kv-bottom", {
                            mixBlendMode: 'normal',
                            duration: 0.8,
                            ease: 'power3.out'
                        });
                    },
                    onComplete: () => {
                        resetElement(target);
                        target.currentTween = null;
                    }
                });
            }
        }
    ];

    const triggers = [];

    function createScrollTriggers() {
        // 再次检查元素是否存在
        if (!blocks.length || !fixedElements.length) {
            console.warn('FixedElementEffects: 创建触发器时元素未找到');
            return;
        }

        blocks.forEach((block, index) => {
            if (!block) return; // 跳过无效的 block

            const effect = effects[index % effects.length];
            fixedElements.forEach((fixedElement) => {
                if (!fixedElement) return; // 跳过无效的 fixedElement

                let elementOffsetTop = getElementTopOffset(fixedElement);
                const trigger = ScrollTrigger.create({
                    trigger: block,
                    start: () => `top ${elementOffsetTop + effect.offsetStartAmount}px`,
                    end: () => `bottom ${elementOffsetTop - effect.offsetEndAmount}px`,
                    onEnter: () => effect.onEnter(fixedElement),
                    onLeaveBack: () => effect.onLeaveBack ? effect.onLeaveBack(fixedElement) : effect.onLeave(fixedElement),
                    onLeave: () => effect.onLeave(fixedElement),
                    onEnterBack: () => effect.onEnterBack ? effect.onEnterBack(fixedElement) : effect.onEnter(fixedElement)
                });
                triggers.push(trigger);
            });
        });
    }

    // 使用 requestAnimationFrame 确保在下一帧创建触发器
    requestAnimationFrame(() => {
        createScrollTriggers();
    });

    window.addEventListener('load', () => {
        // 在 load 事件中重新创建触发器，确保所有资源都已加载
        createScrollTriggers();
    });

    window.addEventListener('resize', () => {
        ScrollTrigger.refresh();
    });

    return () => {
        triggers.forEach(trigger => trigger.kill());
        window.removeEventListener('resize', () => {
            ScrollTrigger.refresh();
        });
    };
}










