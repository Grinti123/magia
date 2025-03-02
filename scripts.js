document.addEventListener("DOMContentLoaded", function() {
  // Check if GSAP is available
  if (typeof gsap === 'undefined') {
    console.error("GSAP library not loaded. Using fallback functionality.");

    // Show the first section
    document.getElementById('section1').classList.add('visible');

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
    const sections = document.querySelectorAll('.section');

    navItems.forEach((item, index) => {
      if (index === 0) item.classList.add('active');

      item.addEventListener('click', function() {
        // Hide all sections
        sections.forEach(section => section.classList.remove('visible'));

        // Show the clicked section
        const targetId = this.getAttribute('data-section');
        document.getElementById(targetId).classList.add('visible');

        // Update active state
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
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

    // Main timeline with ScrollTrigger
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".wrapper",
        start: "top top",
        end: "+=500%",
        pin: true,
        scrub: 1.5, // Faster scrub for more responsive scrolling
        invalidateOnRefresh: true,
        id: "scrolltrigger-main",
        onUpdate: function(self) {
          // Update active navigation based on scroll position
          const navItems = document.querySelectorAll('.lift-nav-item');
          const progress = self.progress * 4; // Scale to 0-4 range for four sections

          let activeIndex;
          if (progress < 1.0) {
            activeIndex = 0;
          } else if (progress < 2.0) {
            activeIndex = 1;
          } else if (progress < 3.0) {
            activeIndex = 2;
          } else {
            activeIndex = 3;
          }

          navItems.forEach((item, index) => {
            if (index === activeIndex) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          });
        }
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

    // Check if on a larger screen
    const isDesktop = window.innerWidth > 1024;
    const isMobile = window.innerWidth <= 768;

    // Show the navigation first
    tl.to(".lift-nav", {
      autoAlpha: 1,
      duration: 0.3,
      ease: "power1.inOut",
      onComplete: function() {
        document.querySelector('.lift-nav').classList.add('visible');
      }
    }, 0)

    // Door and zoom animations start simultaneously
    .to(".door-left", {
      x: "-100%",
      duration: 2,
      ease: "power2.out"
    }, 0.3) // Start after nav appears

    .to(".door-right", {
      x: "100%",
      duration: 2,
      ease: "power2.out"
    }, 0.3) // Start at the same time as door-left

    // Zoom animation starts simultaneously with the doors
    .to(".image-container img", {
      scale: isMobile ? 2 : isDesktop ? 4 : 3,
      z: isMobile ? 250 : isDesktop ? 300 : 350,
      duration: 2, // Same duration as doors
      transformOrigin: "center center",
      ease: "power2.out"
    }, 0.3) // Start at the same time as doors

    // Section scale animation - coordinated with zoom
    .to(".section:first-child", {
      scale: isMobile ? 1.05 : isDesktop ? 1.08 : 1.1,
      duration: 2, // Match zoom duration
      transformOrigin: "center center",
      ease: "power2.out"
    }, 0.3); // Start at the same time as doors and zoom
  }

  // Initialize animation
  initScrollAnimation();

  // Force the section1 to be visible after a short delay
  setTimeout(function() {
    document.getElementById('section1').classList.add('visible');
  }, 500);

  // Reinitialize on window resize with debounce
  let resizeTimer;
  window.addEventListener("resize", function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      initScrollAnimation();

      // Ensure current section remains visible after resize
      const sections = document.querySelectorAll(".section");
      sections.forEach(section => {
        if (isElementInViewport(section)) {
          section.classList.add("visible");
        }
      });
    }, 250);
  });

  // Utility function to check if element is in viewport
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Create observer for sections for general visibility
  const sectionsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, 300);
      }
    });
  }, { threshold: 0.1 });

  // Observe all sections
  const sections = document.querySelectorAll(".section");
  sections.forEach(section => sectionsObserver.observe(section));

  // Initialize lift navigation
  const navItems = document.querySelectorAll('.lift-nav-item');

  // Set first nav item as active by default
  navItems[0].classList.add('active');

  // Handle click events on navigation items
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const targetSection = this.getAttribute('data-section');
      const sectionIndex = parseInt(targetSection.replace('section', '')) - 1;

      // Calculate position based on the animation timeline
      const scrollTrigger = ScrollTrigger.getById('scrolltrigger-main');

      if (scrollTrigger) {
        // Calculate precise progress for each section
        const progress = sectionIndex / 3; // Normalize to 0-1 (for 4 sections)
        const scrollPosition = scrollTrigger.start + (progress * (scrollTrigger.end - scrollTrigger.start));

        // Scroll to position
        gsap.to(window, {
          scrollTo: scrollPosition,
          duration: 0.8,
          ease: "power2.inOut"
        });
      } else {
        // Fallback if ScrollTrigger isn't working
        const section = document.getElementById(targetSection);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }

      // Update active state
      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
    });
  });
});
