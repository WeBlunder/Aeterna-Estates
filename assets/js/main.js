;(function($){

  $(document).ready(function(){
  
  //========== HEADER ACTIVE STRATS ============= //
  if ($("#header").length > 0) {
  $(window).on("scroll", function (event) {
    var scroll = $(window).scrollTop();
    if (scroll < 1) {
    $(".header-area").removeClass("sticky");
    } else {
    $(".header-area").addClass("sticky");
    }
    });
  }
  //========== HEADER ACTIVE ENDS ============= //
  
  //========== SIDEBAR/SEARCH AREA ============= //
  $(".header-search-btn").on("click", function (e) {
    e.preventDefault();
    $(".header-search-form-wrapper").addClass("open");
    $('.header-search-form-wrapper input[type="search"]').focus();
    $('.body-overlay').addClass('active');
  });
  $(".tx-search-close").on("click", function (e) {
    e.preventDefault();
    $(".header-search-form-wrapper").removeClass("open");
    $("body").removeClass("active");
    $('.body-overlay').removeClass('active');
  });
  //========== SIDEBAR/SEARCH AREA ============= //
  
  //========== PAGE PROGRESS STARTS ============= // 
    var progressPath = document.querySelector(".progress-wrap path");
    var pathLength = progressPath.getTotalLength();
    progressPath.style.transition = progressPath.style.WebkitTransition =
    "none";
    progressPath.style.strokeDasharray = pathLength + " " + pathLength;
    progressPath.style.strokeDashoffset = pathLength;
    progressPath.getBoundingClientRect();
    progressPath.style.transition = progressPath.style.WebkitTransition =
      "stroke-dashoffset 10ms linear";
    var updateProgress = function () {
      var scroll = $(window).scrollTop();
      var height = $(document).height() - $(window).height();
      var progress = pathLength - (scroll * pathLength) / height;
      progressPath.style.strokeDashoffset = progress;
    };
    updateProgress();
    $(window).scroll(updateProgress);
    var offset = 50;
    var duration = 550;
    jQuery(window).on("scroll", function () {
      if (jQuery(this).scrollTop() > offset) {
        jQuery(".progress-wrap").addClass("active-progress");
      } else {
        jQuery(".progress-wrap").removeClass("active-progress");
      }
    });
    jQuery(".progress-wrap").on("click", function (event) {
      event.preventDefault();
      jQuery("html, body").animate({ scrollTop: 0 }, duration);
      return false;
    });
  //========== PAGE PROGRESS STARTS ============= // 
  
  //========== VIDEO POPUP STARTS ============= //
     if ($(".popup-youtube").length > 0) {
      $(".popup-youtube").magnificPopup({
      type: "iframe",
      });
      }
  //========== VIDEO POPUP ENDS ============= //
  AOS.init;
  AOS.init({disable: 'mobile'});
  
  //========== NICE SELECT ============= //
  $('select').niceSelect();
  
  });
  //========== COUNTER UP============= //
  const ucounter = $('.counter');
  if (ucounter.length > 0) {
   ucounter.countUp();  
  };
  
  //========== TESTIMONIAL AREA ============= //
  
  // header testimonial //
  $('.home-slider-area').owlCarousel({
    loop:true,
      margin:0,
      nav:false,
      dots:true,
      mouseDrag:false,
      items:1,
      autoplay:true,
      vertical:true,
      navText:["<i class='fa-solid fa-angle-up'></i>" , "<i class='fa-solid fa-angle-down'></i>"],
      animateOut: 'fadeOut',
      animateIn: 'fadeIn',
      active:true,
      smartSpeed:2000,
      autoplayTimeout:4000,
      autoplayHoverPause:false,
      responsiveClass:true,
      responsive:{
          0:{
              items:1,
              nav:false,
          },
          600:{
              items:1,
          },
          1000:{
              items:1,
          }
      }
  });
  
  // testimonial //
  $('.property-slider-area').owlCarousel({
    loop:true,
    margin:30,
    nav:false,
    dots:true,
    items:10,
    autoplay:true,
    smartSpeed:2000,
    autoplayTimeout:3000,
    responsiveClass:true,
    responsive:{
        0:{
            items:1,
        },
        600:{
            items:1,
        },
        1000:{
            items:1,
        }
    }
  });
  
  // testimonial //
  $('.features-slider-area').owlCarousel({
    loop:true,
    margin:30,
    nav:false,
    dots:true,
    items:10,
    autoplay:true,
    smartSpeed:3000,
    autoplayTimeout:4000,
    responsiveClass:true,
    responsive:{
        0:{
            items:1,
            nav:false,
        },
        600:{
            items:2,
        },
        1000:{
            items:3,
        }
    }
  });
  
      $('.slider-nav1').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        asNavFor: '.foter-carousel',
        dots: true,
        arrows:true,
        nav:true,
        loop:true,
        centerMode: false,
        focusOnSelect: true,
        autoplay:true,
        autoplayTimeout:500,
        prevArrow: $('.testimonial-next-arrow'),
        nextArrow: $('.testimonial-prev-arrow'),
      });
      $('.foter-carousel').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        autoplay:true,
        nav:false,
        dots:false,
        prevArrow: $('.testimonial-next-arrow'),
        nextArrow: $('.testimonial-prev-arrow'),
        fade: true,
        loop:true,
        asNavFor: '.slider-nav1',
      });
  
  // testimonial //
  $('.testimonial-boxes-area').owlCarousel({
    loop:true,
    margin:30,
    nav:true,
    dots:false,
    items:10,
    navText:["<i class='fa-solid fa-angle-right'></i>", "<i class='fa-solid fa-angle-left'></i>"],
    autoplay:true,
    smartSpeed:3000,
    autoplayTimeout:4000,
    responsiveClass:true,
    responsive:{
        0:{
            items:1,
            nav:true,
        },
        600:{
            items:1,
        },
        1000:{
            items:1,
        }
    }
  });   
  
  // testimonial //
  $('.slider-images-area').owlCarousel({
    loop:true,
    margin:30,
    nav:false,
    dots:false,
    items:10,
    navText:["<i class='fa-solid fa-angle-right'></i>", "<i class='fa-solid fa-angle-left'></i>"],
    autoplay:true,
    smartSpeed:2000,
    autoplayTimeout:3000,
    responsiveClass:true,
    responsive:{
        0:{
            items:1,
            nav:false,
        },
        600:{
            items:2,
        },
        1000:{
            items:3,
        }
    }
  }); 
  
  // testimonial //
  $('.location-slider-area').owlCarousel({
    loop:true,
    margin:30,
    nav:false,
    dots:false,
    items:10,
    autoplay:true,
    smartSpeed:2000,
    autoplayTimeout:2500,
    responsiveClass:true,
    responsive:{
        0:{
            items:1,
            nav:false,
        },
        600:{
            items:2,
        },
        1000:{
            items:4,
        }
    }
  });
  
  // testimonial //
  $('.header-images-slider').owlCarousel({
    loop:true,
    margin:30,
    nav:false,
    dots:true,
    items:10,
    autoplay:true,
    smartSpeed:2000,
    autoplayTimeout:2500,
    responsiveClass:true,
    responsive:{
        0:{
            items:1,
            nav:false,
        },
        600:{
            items:1,
        },
        1000:{
            items:1,
        }
    }
  });
  
  //testimonial slider
  $(".testimonial-nav").slick({
    slidesToShow: 5,
    slidesToScroll: 1,
    asNavFor: ".slider-testimonial",
    dots: false,
    loop: true,
    centerMode: true,
    focusOnSelect: true,
    arrows: false,
  });
  
  $(".slider-testimonial").slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: $(".testimonial-prev-arrow"),
    nextArrow: $(".testimonial-next-arrow"),
    fade: true,
    loop: true,
    asNavFor: ".testimonial-nav",
  });
  
  // testimonial //
  $('.all-item-area').owlCarousel({
    loop:true,
    margin:30,
    nav:false,
    dots:true,
    items:10,
    autoplay:true,
    smartSpeed:2000,
    autoplayTimeout:2500,
    responsiveClass:true,
    responsive:{
        0:{
            items:1,
            nav:false,
        },
        600:{
            items:1,
        },
        1000:{
            items:1,
        }
    }
  });
  //========== PRELOADER ============= //
  $(window).on("load", function (event) {
    setTimeout(function () {
      $("#preloader").fadeToggle();
    }, 300);
  
  //========== GSAP AREA ============= //
  
  //========== HEADING AREA ============= //
  if ($('.text-anime-style-1').length) {
    let staggerAmount 	= 0.05,
    translateXValue = 0,
    delayValue 		= 0.5,
     animatedTextElements = document.querySelectorAll('.text-anime-style-1');
  
    animatedTextElements.forEach((element) => {
    let animationSplitText = new SplitText(element, { type: "chars, words" });
      gsap.from(animationSplitText.words, {
      duration: 1,
      delay: delayValue,
      x: 20,
      autoAlpha: 0,
      stagger: staggerAmount,
      scrollTrigger: { trigger: element, start: "top 85%" },
      });
    });
    }
  
    if ($('.text-anime-style-2').length) {
    let	 staggerAmount 		= 0.05,
     translateXValue	= 20,
     delayValue 		= 0.5,
     easeType 			= "power2.out",
     animatedTextElements = document.querySelectorAll('.text-anime-style-2');
  
    animatedTextElements.forEach((element) => {
    let animationSplitText = new SplitText(element, { type: "chars, words" });
      gsap.from(animationSplitText.chars, {
        duration: 1,
        delay: delayValue,
        x: translateXValue,
        autoAlpha: 0,
        stagger: staggerAmount,
        ease: easeType,
        scrollTrigger: { trigger: element, start: "top 85%"},
      });
    });
    }
  
    if ($('.text-anime-style-3').length) {
    let	animatedTextElements = document.querySelectorAll('.text-anime-style-3');
  
    animatedTextElements.forEach((element) => {
    //Reset if needed
    if (element.animation) {
      element.animation.progress(1).kill();
      element.split.revert();
    }
  
    element.split = new SplitText(element, {
      type: "lines,words,chars",
      linesClass: "split-line",
    });
    gsap.set(element, { perspective: 400 });
  
    gsap.set(element.split.chars, {
      opacity: 0,
      x: "50",
    });
  
    element.animation = gsap.to(element.split.chars, {
      scrollTrigger: { trigger: element,	start: "top 90%" },
      x: "0",
      y: "0",
      rotateX: "0",
      opacity: 1,
      duration: 1,
      ease: Back.easeOut,
      stagger: 0.02,
    });
    });
    }
  //========== IMAGE ANIMATION AREA ============= //
    if($('.reveal').length){gsap.registerPlugin(ScrollTrigger);let revealContainers=document.querySelectorAll(".reveal");revealContainers.forEach((container)=>{let image=container.querySelector("img");let tl=gsap.timeline({scrollTrigger:{trigger:container,toggleActions:"play none none none"}});tl.set(container,{autoAlpha:1});tl.from(container,1.5,{xPercent:-100,ease:Power2.out});tl.from(image,1.5,{xPercent:100,scale:1.3,delay:-1.5,ease:Power2.out});});}
  
  // pera animation //
    let splitTextLines = gsap.utils.toArray(".text-anim, .text-anim");
      splitTextLines.forEach(splitTextLine => {
      const tl = gsap.timeline({
          scrollTrigger: {
          trigger: splitTextLine,
          start: 'top 90%',
          duration: 2,
          end: 'bottom 60%',
          scrub: false,
          markers: false,
          toggleActions: 'play none none none'
          }
      });
  
      const itemSplitted = new SplitText(splitTextLine, { type: "lines" });
      gsap.set(splitTextLine, { perspective: 400 });
      itemSplitted.split({ type: "lines" })
      tl.from(itemSplitted.lines, { duration: 0.8, delay: 0.3, opacity: 0, rotationX: -40, force3D: true, transformOrigin: "top center -50", stagger: 0.1 });
      });
  
  });
  
  // pera animation //
  let splitTextLines = gsap.utils.toArray(".text-anim1, .text-anim1");
  splitTextLines.forEach(splitTextLine => {
  const tl = gsap.timeline({
      scrollTrigger: {
      trigger: splitTextLine,
      start: 'top 90%',
      duration: 2,
      end: 'bottom 60%',
      scrub: false,
      markers: false,
      toggleActions: 'play none none none'
      }
  });
  
  const itemSplitted = new SplitText(splitTextLine, { type: "lines" });
  gsap.set(splitTextLine, { perspective: 200 });
  itemSplitted.split({ type: "lines" })
  tl.from(itemSplitted.lines, { duration: 0.8, delay: 0.3, opacity: 0, rotationX: -20, force3D: true, transformOrigin: "top center -30", stagger: 0.1 });
  });
  //========== PROGRESS BAR AREA ============= //
  
  
  })(jQuery);
  
  
  