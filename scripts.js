document.addEventListener("DOMContentLoaded", function() {

  // Check if GSAP is available
  if (typeof gsap === 'undefined') {
    console.error("GSAP library not loaded. Using fallback functionality.");

    // Show the navigation
    const liftNav = document.querySelector('.lift-nav');
    liftNav.style.opacity = 1;
    liftNav.style.visibility = 'visible';
    liftNav.classList.add('visible');

    // Show an alert to inform the user
    setTimeout(() => {
      alert("Some animation features are not available. Please ensure you're connected to the internet or contact the site administrator.");
    }, 1000);

    // Basic door animation as fallback
    const doorLeft = document.querySelector('.door-left');
    const doorRight = document.querySelector('.door-right');

    doorLeft.style.transition = 'transform 1.5s ease-in-out';
    doorRight.style.transition = 'transform 1.5s ease-in-out';

    setTimeout(() => {
      doorLeft.style.transform = 'translateX(-100%)';
      doorRight.style.transform = 'translateX(100%)';
    }, 500);

    // Add simple navigation functionality
    const navItems = document.querySelectorAll('.lift-nav-item');

    // Set first nav item as active by default
    navItems[0].classList.add('active');

    // Adjust navigation click behavior for door transition
    navItems.forEach(item => {
      item.addEventListener('click', function() {
        const targetSection = this.getAttribute('data-section');
        const sectionIndex = parseInt(targetSection.replace('section', '')) - 1;

        // Update active state for nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');

        // Function to close current section's doors
        function closeDoors() {
          return new Promise(resolve => {
            // Close the doors
            const doorLeft = document.querySelector('.door-left');
            const doorRight = document.querySelector('.door-right');

            if (doorLeft && doorRight) {
              doorLeft.style.transform = 'translateX(0)';
              doorRight.style.transform = 'translateX(0)';
            }

            // Trigger door closing animation
            setTimeout(() => {
              resolve();
            }, 800); // Match the CSS transition duration
          });
        }

        // Function to open target section's doors
        function openDoors(section) {
          return new Promise(resolve => {
            // Slight delay to ensure previous section is closed
            setTimeout(() => {
              // Open the doors
              const doorLeft = document.querySelector('.door-left');
              const doorRight = document.querySelector('.door-right');

              if (doorLeft && doorRight) {
                doorLeft.style.transform = 'translateX(-100%)';
                doorRight.style.transform = 'translateX(100%)';
              }

              resolve();
            }, 200);
          });
        }

        // Get target section
        const section = document.getElementById(targetSection);

        // Sequence the door transitions
        closeDoors().then(() => {
          section.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            openDoors(section);
          }, 500);
        });
      });
    });

    return; // Exit early since GSAP isn't available
  }

  // If GSAP is available, initialize the advanced functionality
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  // Function to handle scroll animation with responsive considerations
  function initScrollAnimation() {
    // Check if any previous instances exist and kill them
    if (ScrollTrigger.getAll().length > 0) {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }

    // Check device type
    const isMobile = window.innerWidth <= 768;
    const isDesktop = window.innerWidth > 1024;

    // Adjust scroll length based on device type - MUCH SHORTER FOR MOBILE
    const scrollLength = isMobile ? "+=250%" : isDesktop ? "+=500%" : "+=400%";

    // Adjust scrub speed - FASTER FOR MOBILE
    const scrubSpeed = isMobile ? 0.5 : 1.5;

    // Main timeline with ScrollTrigger
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".wrapper",
        start: "top top",
        end: scrollLength, // Shorter scroll distance for mobile
        pin: true,
        scrub: scrubSpeed, // Faster scrub for mobile
        invalidateOnRefresh: true,
        id: "scrolltrigger-main"
      }
    });

    // Set initial position - ensure doors are visible at start
    gsap.set([".door-left", ".door-right"], {
      autoAlpha: 1,
      x: 0 // Reset position in case of resize
    });

    // Hide lift nav initially
    gsap.set(".lift-nav", {
      autoAlpha: 0
    });

    // Adjust animation durations based on device
    const doorDuration = isMobile ? 1 : 2;
    const zoomDuration = isMobile ? 1 : 2;

    // Door and zoom animations start simultaneously
    tl.to(".door-left", {
      x: "-100%",
      duration: doorDuration,
      ease: "power2.out"
    }, 0) // Start immediately

    .to(".door-right", {
      x: "100%",
      duration: doorDuration,
      ease: "power2.out"
    }, 0) // Start at the same time as door-left

    // Zoom animation starts simultaneously with the doors
    .to(".image-container img", {
      scale: isMobile ? 2 : isDesktop ? 4 : 3,
      z: isMobile ? 250 : isDesktop ? 300 : 350,
      duration: zoomDuration, // Same duration as doors
      transformOrigin: "center center",
      ease: "power2.out"
    }, 0) // Start at the same time as doors

    // Section scale animation - coordinated with zoom
    .to(".section:first-child", {
      scale: isMobile ? 1.05 : isDesktop ? 1.08 : 1.1,
      duration: zoomDuration, // Match zoom duration
      transformOrigin: "center center",
      ease: "power2.out"
    }, 0) // Start at the same time as doors and zoom

    // Move the lift-nav animation to appear AFTER the door and zoom animations
    .to(".lift-nav", {
      autoAlpha: 1,
      duration: 0.3,
      ease: "power1.inOut",
      onComplete: function() {
        document.querySelector('.lift-nav').classList.add('visible');
      }
    }, doorDuration); // Start after the doors and zoom finish
  }

  // Initialize animation
  initScrollAnimation();

  // Reinitialize on window resize with debounce
  let resizeTimer;
  window.addEventListener("resize", function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      initScrollAnimation();
    }, 250);
  });

  // Initialize lift navigation
  const navItems = document.querySelectorAll('.lift-nav-item');

  // Set first nav item as active by default
  navItems[0].classList.add('active');

  // UPDATED LIFT NAVIGATION FUNCTIONALITY
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const targetSection = this.getAttribute('data-section');
      const sectionIndex = parseInt(targetSection.replace('section', '')) - 1;
      const targetSectionElement = document.getElementById(targetSection);

      // Update active state for nav items
      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');

      // Function to close doors
      function closeDoors() {
        return new Promise(resolve => {
          // Close the doors
          const doorLeft = document.querySelector('.door-left');
          const doorRight = document.querySelector('.door-right');

          if (doorLeft && doorRight) {
            gsap.to(doorLeft, { x: "0%", duration: 0.5, ease: "power2.out" });
            gsap.to(doorRight, { x: "0%", duration: 0.5, ease: "power2.out" });
          }

          // Allow time for door animation
          setTimeout(resolve, 600);
        });
      }

      // Function to open doors
      function openDoors() {
        return new Promise(resolve => {
          const doorLeft = document.querySelector('.door-left');
          const doorRight = document.querySelector('.door-right');

          if (doorLeft && doorRight) {
            gsap.to(doorLeft, { x: "-100%", duration: 0.5, ease: "power2.out" });
            gsap.to(doorRight, { x: "100%", duration: 0.5, ease: "power2.out" });
          }

          // Make sure the corresponding dottie is properly shown
          const dottieId = `dottie${sectionIndex + 1}`;
          const dottie = document.getElementById(dottieId);

          resolve();
        });
      }

      // Execute navigation with door animations
      closeDoors().then(() => {
        // Get the ScrollTrigger instance
        const scrollTrigger = ScrollTrigger.getById('scrolltrigger-main');
        if (scrollTrigger) {
          // Calculate the exact progress based on section index
          const progress = sectionIndex / 3; // For 4 sections

          // Calculate the scroll position
          const scrollPosition = scrollTrigger.start + (progress * (scrollTrigger.end - scrollTrigger.start));

          // Set the scroll position with GSAP
          gsap.to(window, {
            scrollTo: scrollPosition,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: function() {
              openDoors();
              // Force a refresh to ensure everything is in sync
              ScrollTrigger.refresh();
            }
          });
        } else {
          // Fallback if ScrollTrigger is not available
          targetSectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(openDoors, 500);
        }
      });
    });
  });

  // Use only the LottieObserver for active navigation
  const lottieObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        // Get the dottie number from the ID (e.g., "dottie1" → 1)
        const dottieId = entry.target.id;
        const dottieNumber = parseInt(dottieId.replace('dottie', ''));

        // Update the navigation to match the visible dottie
        const navItems = document.querySelectorAll('.lift-nav-item');
        navItems.forEach((item, index) => {
          if (index === dottieNumber - 1) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: [0.5] }); // Trigger when Lottie is 50% visible

  // Observe all Lottie containers
  document.querySelectorAll('.lottie-container').forEach(lottie => {
    lottieObserver.observe(lottie);
  });

  // Handle arrow container visibility on scroll
  const arrowContainer = document.getElementById('arrow-container');

  // Show arrow on page load
  if (arrowContainer) {
    arrowContainer.style.opacity = '1';
  }

  // Hide arrow on scroll
  let scrollTimer;
  window.addEventListener('scroll', function() {
    if (arrowContainer) {
      // Hide the arrow container
      arrowContainer.style.opacity = '0';

      // Clear any existing timers
      clearTimeout(scrollTimer);

      // If the user returns to the top of the page, show the arrow again
      if (window.scrollY <= 100) {
        scrollTimer = setTimeout(function() {
          arrowContainer.style.opacity = '1';
        }, 1000);
      }
    }
  });
});
