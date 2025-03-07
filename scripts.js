const intro = document.getElementById('intro');
const introContent = document.querySelector('.intro-content');
const scene = document.getElementById('scene');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const sections = document.querySelectorAll('.section');
const parallaxContainer = document.querySelector('.parallax-container');
const doorLeft = document.querySelector('.door-left');
const doorRight = document.querySelector('.door-right');
const btnLifts = document.querySelectorAll('.btn-lift');

let transitionComplete = false;
let wheeling = false;
let isScrolling = false;
let scrollTimeout;
let currentFloor = 0; // 0-based index (0 = floor 1)
let isTransitioning = false;
let touchStartY = 0;
let touchEndY = 0;

// Initialize GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Setup GSAP animations
const setupGSAP = () => {
    // Create timeline for intro animations
    const introTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: ".parallax-container",
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
                // Update progress bar
                gsap.to(progress, {
                    width: `${self.progress * 100}%`,
                    duration: 0.1,
                    ease: "none"
                });

                // Animate the doors based on scroll progress
                gsap.to(doorLeft, {
                    x: `-${self.progress * 100}%`,
                    duration: 0.1,
                    ease: "none"
                });

                gsap.to(doorRight, {
                    x: `${self.progress * 100}%`,
                    duration: 0.1,
                    ease: "none"
                });

                // Complete transition when progress reaches 98%
                if (self.progress >= 0.98 && !transitionComplete) {
                    // Immediately hide the intro to prevent flashing
                    gsap.set(intro, { opacity: 0, visibility: "hidden" });
                    completeTransition();
                }
            }
        }
    });

    // Add animations to timeline
    introTimeline
        .to(introContent, {
            scale: 3,
            ease: "power1.inOut",
            duration: 1
        }, 0)
        .to(intro, {
            opacity: 0,
            ease: "power1.inOut",
            duration: 1
        }, 0.5);
};

// Check if it's a touch device
const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Check if it's a mobile device
const isMobileDevice = () => {
    return window.innerWidth < 768;
};

// Modified completeTransition function to completely bypass door transition for first section
function completeTransition() {
  if (transitionComplete) return;
  transitionComplete = true;

  // Kill all ScrollTriggers
  ScrollTrigger.getAll().forEach(st => st.kill());

  // Hide progress bar
  gsap.to(progressBar, {
      opacity: 0,
      duration: 0.5
  });

  // Apply these changes immediately
  gsap.set(intro, { opacity: 0, visibility: "hidden" });

  // Show elevator after intro animation
  setTimeout(() => {
      intro.style.display = 'none';
      parallaxContainer.style.display = 'none';

      // IMPORTANT: Hide doors first before showing the scene
      // This prevents any flash of the doors
      const leftDoor = document.querySelector('.left-door');
      const rightDoor = document.querySelector('.right-door');

      // Temporarily hide doors
      leftDoor.style.display = 'none';
      rightDoor.style.display = 'none';

      // Make scene visible with doors already open
      scene.classList.add('show');
      scene.classList.add('open');

      // Load animations if not already loaded
      loadLottieAnimations();

      // Enable scroll wheel detection for elevator navigation
      setupNavigation();

      // Enable body scroll for inside elevator
      document.body.style.overflow = '';

      // Update floor button indicators
      updateFloorIndicators(0);

      // Re-enable doors after a short delay, so they work for navigation
      setTimeout(() => {
          leftDoor.style.display = '';
          rightDoor.style.display = '';
      }, 100);
  }, 500);
}


// Setup navigation (scroll and touch)
function setupNavigation() {
    // Mouse wheel support
    window.addEventListener('wheel', handleElevatorScroll, { passive: false });

    // Touch support for mobile
    if (isTouchDevice()) {
        // FIXED: Changed touchstart event to passive false
        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: false });

        // FIXED: Added touchmove with passive false to prevent default behavior
        window.addEventListener('touchmove', (e) => {
            if (isTransitioning || !transitionComplete) return;
            // Prevent default to stop page scrolling during swipe
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    // Keyboard support for accessibility
    window.addEventListener('keydown', handleKeyboardNavigation);
}

// Handle touch end for swipe navigation
function handleTouchEnd(e) {
    if (isTransitioning || !transitionComplete) return;

    touchEndY = e.changedTouches[0].clientY;
    const swipeDistance = touchStartY - touchEndY;

    // Threshold to detect swipe (lowered for better response)
    if (Math.abs(swipeDistance) > 30) {
        // Prevent default to stop any unwanted behaviors
        e.preventDefault();

        if (!isScrolling) {
            isScrolling = true;

            // FIXED: Added console log for debugging
            console.log("Swipe detected: ", swipeDistance > 0 ? "UP" : "DOWN");

            if (swipeDistance > 0) {
                // Swipe up - go to next floor if not at last floor
                if (currentFloor < sections.length - 1) {
                    goToFloor(currentFloor + 1);
                }
            } else {
                // Swipe down - go to previous floor or intro
                if (currentFloor > 0) {
                    goToFloor(currentFloor - 1);
                } else {
                    goBackToIntro();
                }
            }

            // Debounce events
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 1000);
        }
    }
}

// Keyboard navigation support
function handleKeyboardNavigation(e) {
    if (isTransitioning) return;

    // Arrow up/down keys
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();

        if (!isScrolling) {
            isScrolling = true;

            if (e.key === 'ArrowDown') {
                // Go to next floor if not at last floor
                if (currentFloor < sections.length - 1) {
                    goToFloor(currentFloor + 1);
                }
            } else {
                // Go to previous floor or intro
                if (currentFloor > 0) {
                    goToFloor(currentFloor - 1);
                } else {
                    goBackToIntro();
                }
            }

            // Debounce events
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 1000);
        }
    }

    // Number keys 1-4 for direct floor access
    if (e.key >= '1' && e.key <= '4') {
        const floorIndex = parseInt(e.key) - 1;
        if (floorIndex >= 0 && floorIndex < sections.length) {
            goToFloor(floorIndex);
        }
    }
}

// Handle scroll wheel events inside elevator
function handleElevatorScroll(e) {
    if (isTransitioning) return;

    e.preventDefault();

    if (!isScrolling) {
        isScrolling = true;

        // Determine scroll direction
        if (e.deltaY > 0) {
            // Scrolling down - go to next floor if not at last floor
            if (currentFloor < sections.length - 1) {
                goToFloor(currentFloor + 1);
            }
        } else {
            // Scrolling up
            if (currentFloor > 0) {
                // Go to previous floor
                goToFloor(currentFloor - 1);
            } else {
                // At first floor, go back to intro
                goBackToIntro();
            }
        }

        // Debounce scroll events
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 1000);
    }
}

// Function to go back to intro with zoom-out effect
function goBackToIntro() {
    if (isTransitioning) return;
    isTransitioning = true;

    // Clean up Lottie animations to prevent duplicates
    if (window.lottieAnimations) {
        window.lottieAnimations.forEach(anim => {
            if (anim) {
                anim.destroy();
            }
        });
        window.lottieAnimations = null;
    }

    // Close elevator doors first
    scene.classList.remove('open');
    scene.classList.add('closed');

    // Start transition back to intro
    setTimeout(() => {
        // Reset flags
        transitionComplete = false;
        isTransitioning = false;

        // Remove event listeners
        window.removeEventListener('wheel', handleElevatorScroll);
        if (isTouchDevice()) {
            // FIXED: Remove all touch event listeners
            window.removeEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; });
            window.removeEventListener('touchmove', (e) => { e.preventDefault(); });
            window.removeEventListener('touchend', handleTouchEnd);
        }
        window.removeEventListener('keydown', handleKeyboardNavigation);

        // Hide elevator container
        scene.classList.remove('show');

        // Show intro elements
        intro.style.display = 'flex';
        parallaxContainer.style.display = 'block';
        progressBar.style.opacity = '1';

        // Reset doors position
        gsap.set(doorLeft, { x: '-100%' });
        gsap.set(doorRight, { x: '100%' });

        // Create reverse zoom animation
        const reverseTimeline = gsap.timeline();

        // Set initial state (zoom in)
        gsap.set(introContent, { scale: 3 });
        gsap.set(intro, { opacity: 0, visibility: "visible" });

        // Animate zoom out
        reverseTimeline
            .to(introContent, {
                scale: 1,
                ease: "power1.inOut",
                duration: 1
            }, 0)
            .to(intro, {
                opacity: 1,
                ease: "power1.inOut",
                duration: 1
            }, 0);

        // Reset scroll position
        window.scrollTo({ top: 0, behavior: 'auto' });

        // Re-setup GSAP
        setTimeout(() => {
            setupGSAP();
        }, 500);
    }, isMobileDevice() ? 500 : 1000); // Faster transition for mobile
}

// Load Lottie animations
function loadLottieAnimations() {
    // Clear any existing animations first
    document.getElementById("dottie1").innerHTML = "";
    document.getElementById("dottie2").innerHTML = "";
    document.getElementById("dottie3").innerHTML = "";
    document.getElementById("dottie4").innerHTML = "";

    // Initialize new animation instances
    const anim1 = lottie.loadAnimation({
        container: document.getElementById("dottie1"),
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "./jsons/piso1.json"
    });

    const anim2 = lottie.loadAnimation({
        container: document.getElementById("dottie2"),
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "./jsons/piso2.json"
    });

    const anim3 = lottie.loadAnimation({
        container: document.getElementById("dottie3"),
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "./jsons/piso3.json"
    });

    const anim4 = lottie.loadAnimation({
        container: document.getElementById("dottie4"),
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "./jsons/piso4.json"
    });

    // Store animation references for later cleanup
    window.lottieAnimations = [anim1, anim2, anim3, anim4];
}

// Modified goToFloor function to ensure we use door transitions for navigation
function goToFloor(index) {
  if (isTransitioning || currentFloor === index) return;
  isTransitioning = true;

  // FIXED: Added console log for debugging
  console.log("Going to floor:", index + 1);

  // Close the doors
  scene.classList.remove("open");
  scene.classList.add("closed");

  // Get the transition time based on device type
  const transitionTime = isMobileDevice() ? 500 : 1000;

  // Wait for doors to close
  setTimeout(() => {
      // Change active section
      document.querySelector(".active").classList.remove("active");
      sections[index].classList.add("active");

      // Update current floor
      currentFloor = index;

      // Update floor button indicators
      updateFloorIndicators(currentFloor);

      // Wait for elevator to "move"
      setTimeout(() => {
          // Open doors
          scene.classList.remove("closed");
          scene.classList.add("open");

          // Reset transition flag
          isTransitioning = false;
      }, transitionTime);
  }, transitionTime);
}

// Update floor indicators
function updateFloorIndicators(floorIndex) {
    // Update active button
    btnLifts.forEach((btn, index) => {
        if (index === floorIndex) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// FIXED: Add touchmove handler for the intro section as well
function preventDefaultTouchMove(e) {
    if (!transitionComplete) {
        // Only prevent default if we're in a scrollable area
        const scrollPos = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;

        // If we're not at the top or bottom, prevent default
        if (scrollPos > 0 && scrollPos < scrollHeight - windowHeight) {
            e.preventDefault();
        }
    }
}

// Initialize on page load
window.onload = () => {
    setupGSAP();

    // FIXED: Add a CSS class for touch-action: none to the container when in elevator mode
    const addStyle = document.createElement('style');
    addStyle.innerHTML = `
        .container.show {
            touch-action: none;
        }
    `;
    document.head.appendChild(addStyle);

    // FIXED: Add debug touch events for mobile testing
    if (isTouchDevice()) {
        // Debugging touch events
        document.addEventListener('touchstart', function(e) {
            console.log('Touch start detected');
        });

        document.addEventListener('touchend', function(e) {
            console.log('Touch end detected');
        });
    }
};
