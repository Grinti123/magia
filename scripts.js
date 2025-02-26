console.clear();

gsap.registerPlugin(ScrollTrigger);

window.addEventListener("load", () => {
  gsap
    .timeline({
      scrollTrigger: {
        trigger: ".wrapper",
        start: "top top",
        end: "+=150%",
        pin: true,
        scrub: true,
        markers: true
      }
    })
    .to("img", {
      scale: 3,
      z: 350,
      transformOrigin: "center center",
      ease: "power1.inOut"
    })
    .to(
      ".section.hero",
      {
        scale: 1.1,
        transformOrigin: "center center",
        ease: "power1.inOut"
      },
      "<"
    );
});

document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll("section");

  function checkScroll() {
      sections.forEach((section) => {
          const sectionTop = section.getBoundingClientRect().top;
          const triggerPoint = window.innerHeight / 1.2; // Trigger fade when section is 80% in view

          if (sectionTop < triggerPoint) {
              section.classList.add("visible");
          }
      });
  }

  window.addEventListener("scroll", checkScroll);
  checkScroll(); // Run initially in case first section is already visible
});

