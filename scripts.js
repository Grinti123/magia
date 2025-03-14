// Preloader with progress indicator
document.addEventListener('DOMContentLoaded', function() {
  const preloader = document.getElementById('preloader');
  const progressBar = document.querySelector('.progress-bar');
  let width = 0;

  // Progress bar animation
  const interval = setInterval(function() {
      if (width >= 100) {
          clearInterval(interval);

          // Hide preloader after reaching 100%
          setTimeout(function() {
              preloader.classList.add('hidden');

              // Remove preloader from DOM after transition completes
              setTimeout(function() {
                  preloader.style.display = 'none';
              }, 500);
          }, 300);
      } else {
          width++;
          progressBar.style.width = width + '%';
      }
  }, 30); // Adjust timing as needed (30ms = ~3 seconds to reach 100%)
});

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

// Check if it's a touch device
const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Check if it's a mobile device
const isMobileDevice = () => {
    return window.innerWidth < 768;
};

// Initialize GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Setup GSAP animations
const setupGSAP = () => {
  // Create timeline for intro animations with MUCH FASTER scrub value for mobile
  const scrubValue = isMobileDevice() ? 0.1 : 0.5; // Even faster for mobile (0.1 instead of 0.5)

  // Adjust parallax container height based on device
  // Make it shorter on mobile for faster scrolling completion
  if (isMobileDevice()) {
    parallaxContainer.style.height = '150vh'; // Reduced from 300vh to 150vh for mobile
  }

  const introTimeline = gsap.timeline({
      scrollTrigger: {
          trigger: ".parallax-container",
          start: "top top",
          end: "bottom bottom",
          scrub: scrubValue,
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

              // Complete transition when progress reaches 75% for mobile (90% for desktop)
              const completionThreshold = isMobileDevice() ? 0.75 : 0.90;
              if (self.progress >= completionThreshold && !transitionComplete) {
                  // Immediately hide the intro to prevent flashing
                  gsap.set(intro, { opacity: 0, visibility: "hidden" });
                  completeTransition();
              }
          }
      }
  });

  // Add animations to timeline with FASTER duration
  const zoomDuration = isMobileDevice() ? 0.3 : 0.5; // Even faster for mobile
  const fadeOutStart = isMobileDevice() ? 0.1 : 0.3; // Start fade earlier on mobile

  introTimeline
      .to(introContent, {
          scale: 5,
          ease: "power3.in", // Changed to power3.in for even faster acceleration
          duration: zoomDuration
      }, 0)
      .to(intro, {
          opacity: 0,
          ease: "power3.in",
          duration: zoomDuration
      }, fadeOutStart);
};

// Setup navigation (scroll and touch)
function setupNavigation() {
    // Mouse wheel support
    window.addEventListener('wheel', handleElevatorScroll, { passive: false });

    // Touch support for mobile
    if (isTouchDevice()) {
        // Change touchstart to be more responsive
        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: false });

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

// Handle touch end for swipe navigation - ENHANCED FOR SENSITIVITY
function handleTouchEnd(e) {
    if (isTransitioning || !transitionComplete) return;

    touchEndY = e.changedTouches[0].clientY;
    const swipeDistance = touchStartY - touchEndY;

    // Significantly reduced threshold to detect swipe for better response
    // This is the key change for "one swipe is enough"
    if (Math.abs(swipeDistance) > 5) { // Changed from 10 to 5 - much more sensitive
        // Prevent default to stop any unwanted behaviors
        e.preventDefault();

        if (!isScrolling) {
            isScrolling = true;

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

            // Shorter debounce for faster interaction
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 100); // Changed from 200 to 100 for faster response time
        }
    }
}

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
  }, 300); // Reduced from 500 to 300 for faster transition
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
            }, 100); // Reduced from 200 to 100
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
        }, 100); // Reduced from 200 to 100
    }
}

// Modified goBackToIntro function with complete solution
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

  // Hide all sections that aren't section1 immediately
  sections.forEach(section => {
      if (section.id !== 'section1') {
          section.style.display = 'none';
      }
  });

  // Get reference to section 1
  const section1 = document.getElementById('section1');

  // Prepare the intro elements before animation starts but keep them invisible
  intro.style.display = 'flex';
  gsap.set(intro, { opacity: 0, visibility: "hidden" });
  parallaxContainer.style.display = 'block';
  progressBar.style.opacity = '0'; // Keep invisible initially

  // Start with doors fully open but hidden
  gsap.set(doorLeft, { x: '-100%' });
  gsap.set(doorRight, { x: '100%' });

  // Create a zoom-out effect for section 1 - faster on mobile
  const animDuration = isMobileDevice() ? 0.5 : 1;

  gsap.to(section1, {
      scale: 0.5,
      opacity: 0,
      duration: animDuration,
      ease: "power1.inOut",
      onComplete: () => {
          // CRITICAL: Hide the entire elevator container immediately
          scene.style.visibility = 'hidden';

          // Start intro transition now that section1 is completely gone
          showIntroElements();
      }
  });
}

// Function to show intro elements once section1 is gone
function showIntroElements() {
  // Make intro visible immediately
  gsap.set(intro, { visibility: "visible" });
  gsap.set(progressBar, { opacity: 1 });

  // Set initial state for intro (zoomed in)
  gsap.set(introContent, { scale: 3 });

  // Animate intro content and doors - faster on mobile
  const animDuration = isMobileDevice() ? 0.5 : 1;

  const reverseTimeline = gsap.timeline();
  reverseTimeline
      .to(introContent, {
          scale: 1,
          ease: "power1.inOut",
          duration: animDuration
      }, 0)
      .to(intro, {
          opacity: 1,
          ease: "power1.inOut",
          duration: animDuration
      }, 0)
      // Animate doors closing as intro zooms out
      .to(doorLeft, {
          x: '0%',  // Close left door
          ease: "power1.inOut",
          duration: animDuration
      }, 0)
      .to(doorRight, {
          x: '0%',  // Close right door
          ease: "power1.inOut",
          duration: animDuration
      }, 0);

  // After the intro animation completes, finish cleanup - faster on mobile
  const cleanupDelay = isMobileDevice() ? 500 : 1000;

  setTimeout(() => {
      // Officially remove elevator scene from DOM flow
      scene.classList.remove('show');

      // Restore section1 but keep it invisible
      const section1 = document.getElementById('section1');
      gsap.set(section1, { scale: 1, opacity: 1 });

      // Make other sections visible again for next time
      sections.forEach(section => {
          section.style.display = '';
      });

      // Reset flags
      transitionComplete = false;
      isTransitioning = false;

      // Remove event listeners
      window.removeEventListener('wheel', handleElevatorScroll);
      if (isTouchDevice()) {
          window.removeEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; });
          window.removeEventListener('touchmove', (e) => { e.preventDefault(); });
          window.removeEventListener('touchend', handleTouchEnd);
      }
      window.removeEventListener('keydown', handleKeyboardNavigation);

      // Reset scroll position
      window.scrollTo({ top: 0, behavior: 'auto' });

      // Re-setup GSAP
      setupGSAP();

      // Finally, restore scene visibility for next time
      scene.style.visibility = '';
  }, cleanupDelay);
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

  // Get the transition time based on device type - MUCH faster for mobile
  const transitionTime = isMobileDevice() ? 200 : 1000; // Changed from 300 to 200 for mobile

  // Wait for doors to close
  setTimeout(() => {
      // Change active section
      document.querySelector(".active").classList.remove("active");
      sections[index].classList.add("active");

      // Update current floor
      currentFloor = index;

      // Update floor button indicators
      updateFloorIndicators(currentFloor);

      // Wait for elevator to "move" - faster on mobile
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

// Add improved touchmove handling for better mobile responsiveness
function handleTouchMove(e) {
    if (!transitionComplete) {
        // During intro, let's calculate if we should trigger immediate completion
        // This helps with "one swipe is enough" on the intro screen
        const touch = e.touches[0];
        const currentTouchY = touch.clientY;

        // Calculate distance moved
        const touchDistance = touchStartY - currentTouchY;

        // If significant downward swipe detected (>50px) during intro
        if (touchDistance > 50 && !transitionComplete) {
            // Force immediate completion of intro
            ScrollTrigger.getAll().forEach(st => {
                // Force progress to 100%
                st.scroll(st.end);
            });

            // Prevent default behavior
            e.preventDefault();
        }
    }
}

// Initialize on page load
window.onload = () => {
    setupGSAP();

    // Add CSS class for touch-action: none to the container when in elevator mode
    const addStyle = document.createElement('style');
    addStyle.innerHTML = `
        .container.show {
            touch-action: none;
        }

        /* Add specific mobile optimizations in CSS */
        @media (max-width: 767px) {
            .door {
                transition: transform 0.3s ease-in-out !important;
            }

            /* Force hardware acceleration for smoother animations */
            .intro-content, .door-left, .door-right, .section {
                transform: translateZ(0);
                will-change: transform;
            }
        }
    `;
    document.head.appendChild(addStyle);

    // Add the enhanced touch handlers for mobile
    if (isTouchDevice()) {
        // Add our new touchmove handler for better intro scrolling
        document.addEventListener('touchmove', handleTouchMove, { passive: false });

        // Add additional touch event handler with direction detection
        let lastTouchY = 0;
        let touchDirectionChange = false;

        document.addEventListener('touchmove', function(e) {
            const currentY = e.touches[0].clientY;

            // Detect if direction changed during swipe
            if ((currentY > lastTouchY && touchStartY < lastTouchY) ||
                (currentY < lastTouchY && touchStartY > lastTouchY)) {
                touchDirectionChange = true;
            }

            lastTouchY = currentY;

            // If in intro and significant distance traveled in one direction,
            // advance progress faster for more responsive feel
            if (!transitionComplete && !touchDirectionChange &&
                Math.abs(touchStartY - currentY) > 30) {
                // Speed up progress
                const st = ScrollTrigger.getAll()[0];
                if (st) {
                    // Jump ahead in progress
                    const jumpAmount = currentY < touchStartY ? 0.2 : -0.2;
                    const newProgress = Math.max(0, Math.min(1, st.progress + jumpAmount));
                    st.scroll(st.start + (st.end - st.start) * newProgress);
                }
            }
        }, { passive: false });

        // Reset direction change flag on new touch
        document.addEventListener('touchstart', function() {
            touchDirectionChange = false;
            // Set a flag specifically for intro fast-track
            if (!transitionComplete) {
                window.fastTrackIntro = true;
            }
        }, { passive: false });
    }
};
