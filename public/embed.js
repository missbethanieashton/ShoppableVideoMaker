(function() {
  // Inject font imports
  if (!document.getElementById('shoppable-video-fonts')) {
    const fontLink1 = document.createElement('link');
    fontLink1.id = 'shoppable-video-fonts';
    fontLink1.href = 'https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;500;600;700&family=Lacquer&display=swap';
    fontLink1.rel = 'stylesheet';
    document.head.appendChild(fontLink1);
    
    const fontLink2 = document.createElement('link');
    fontLink2.href = 'https://fonts.cdnfonts.com/css/glacial-indifference-2';
    fontLink2.rel = 'stylesheet';
    document.head.appendChild(fontLink2);
  }

  // Inject animation styles
  if (!document.getElementById('shoppable-video-styles')) {
    const style = document.createElement('style');
    style.id = 'shoppable-video-styles';
    style.textContent = `
      @keyframes slow-drift {
        0%, 100% { transform: translate(0, 0); }
        25% { transform: translate(3px, -3px); }
        50% { transform: translate(-2px, 2px); }
        75% { transform: translate(2px, 3px); }
      }
      
      @keyframes gentle-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      
      @keyframes soft-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      @keyframes fade-in {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      
      .shoppable-carousel {
        animation: fade-in 0.3s ease-out;
      }
      
      .shoppable-carousel.animation-hover {
        animation: fade-in 0.3s ease-out, slow-drift 6s ease-in-out infinite;
      }
      
      .shoppable-carousel.animation-float {
        animation: fade-in 0.3s ease-out, gentle-float 3s ease-in-out infinite;
      }
      
      .shoppable-carousel.animation-pulse {
        animation: fade-in 0.3s ease-out, soft-pulse 2s ease-in-out infinite;
      }
      
      @keyframes typewriter-slow {
        from { width: 0; }
        to { width: 100%; }
      }
      
      @keyframes typewriter-medium {
        from { width: 0; }
        to { width: 100%; }
      }
      
      @keyframes typewriter-fast {
        from { width: 0; }
        to { width: 100%; }
      }
      
      @keyframes glow-pulse {
        0%, 100% {
          text-shadow: 0 0 4px currentColor, 0 0 8px currentColor;
        }
        50% {
          text-shadow: 0 0 8px currentColor, 0 0 16px currentColor, 0 0 20px currentColor;
        }
      }
      
      .text-typewriter-slow {
        overflow: hidden;
        white-space: nowrap;
        animation: typewriter-slow 4s steps(240) forwards;
      }
      
      .text-typewriter-medium {
        overflow: hidden;
        white-space: nowrap;
        animation: typewriter-medium 2.5s steps(150) forwards;
      }
      
      .text-typewriter-fast {
        overflow: hidden;
        white-space: nowrap;
        animation: typewriter-fast 1.5s steps(90) forwards;
      }
      
      .text-glow {
        animation: glow-pulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  window.ShoppableVideo = {
    apiUrl: null,
    videoId: null,
    viewTracked: false,
    productCache: new Map(),
    scrollStates: new Map(), // Track scroll states for each carousel (0=title, 1=price, 2=button)

    getFontFamily: function(fontFamily) {
      switch (fontFamily) {
        case 'league-spartan':
          return 'League Spartan, sans-serif';
        case 'glacial-indifference':
          return 'Glacial Indifference, sans-serif';
        case 'lacquer':
          return 'Lacquer, cursive';
        default:
          return 'inherit';
      }
    },
    
    getTextAnimationClass: function(textAnimation) {
      switch (textAnimation) {
        case 'typewriter-slow':
          return 'text-typewriter-slow';
        case 'typewriter-medium':
          return 'text-typewriter-medium';
        case 'typewriter-fast':
          return 'text-typewriter-fast';
        case 'glow':
          return 'text-glow';
        default:
          return '';
      }
    },
    
    initScrollState: function(carouselId) {
      if (!this.scrollStates.has(carouselId)) {
        this.scrollStates.set(carouselId, { 
          index: 0, 
          lastUpdate: Date.now(),
          intervalId: null
        });
        
        // Set up interval to cycle scroll state
        // The normal timeupdate event will pick up the state changes and redraw
        const state = this.scrollStates.get(carouselId);
        state.intervalId = setInterval(() => {
          state.index = (state.index + 1) % 3;
          state.lastUpdate = Date.now();
        }, 1000);
      }
      return this.scrollStates.get(carouselId);
    },
    
    clearScrollState: function(carouselId) {
      const state = this.scrollStates.get(carouselId);
      if (state && state.intervalId) {
        clearInterval(state.intervalId);
        this.scrollStates.delete(carouselId);
      }
    },
    
    getScrollIndex: function(carouselId) {
      const state = this.scrollStates.get(carouselId);
      return state ? state.index : 0;
    },

    init: function(options) {
      const { containerId, videoId, apiUrl } = options;
      this.apiUrl = apiUrl;
      this.videoId = videoId;
      this.viewTracked = false;
      this.productCache = new Map();
      const container = document.getElementById(containerId);
      
      if (!container) {
        console.error('Shoppable Video: Container not found');
        return;
      }

      fetch(`${apiUrl}/videos/${videoId}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          return res.json();
        })
        .then(video => {
          this.renderPlayer(container, video);
        })
        .catch(err => {
          console.error('Shoppable Video: Failed to load video', err);
          container.innerHTML = '<p style="color:red;">Failed to load video. Check console for details.</p>';
        });
    },

    trackAnalytics: function(eventType, productId = null) {
      if (!this.apiUrl || !this.videoId) return;
      
      fetch(`${this.apiUrl}/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: this.videoId,
          productId: productId,
          eventType: eventType,
          timestamp: Math.floor(Date.now() / 1000)
        })
      }).catch(err => {
        console.error('Analytics tracking failed:', err);
      });
    },

    renderPlayer: function(container, video) {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.width = '100%';
      wrapper.style.maxWidth = '100%';

      const videoElement = document.createElement('video');
      videoElement.src = video.videoUrl;
      videoElement.controls = true;
      videoElement.style.width = '100%';
      videoElement.style.display = 'block';

      const carouselContainer = document.createElement('div');
      carouselContainer.id = 'carousel-container';
      carouselContainer.style.position = 'absolute';
      carouselContainer.style.pointerEvents = 'none';
      carouselContainer.style.top = '0';
      carouselContainer.style.left = '0';
      carouselContainer.style.width = '100%';
      carouselContainer.style.height = '100%';

      wrapper.appendChild(videoElement);
      wrapper.appendChild(carouselContainer);
      container.appendChild(wrapper);

      videoElement.addEventListener('play', () => {
        if (!this.viewTracked) {
          this.trackAnalytics('view');
          this.viewTracked = true;
        }
      });

      videoElement.addEventListener('timeupdate', () => {
        this.updateCarousel(carouselContainer, video, videoElement.currentTime);
      });
    },

    updateCarousel: function(container, video, currentTime) {
      container.innerHTML = '';
      
      const activePlacements = video.productPlacements.filter(
        p => currentTime >= p.startTime && currentTime <= p.endTime
      );

      // Track active carousel IDs for cleanup
      const activeCarouselIds = new Set();

      activePlacements.forEach((placement) => {
        const carouselId = `${video.id}-${placement.productId}-${placement.startTime}`;
        activeCarouselIds.add(carouselId);

        if (this.productCache.has(placement.productId)) {
          const product = this.productCache.get(placement.productId);
          const carousel = this.createCarousel(product, video.carouselConfig, carouselId);
          
          // Apply position styles
          const positionStyles = this.getPositionStyles(video.carouselConfig.position);
          Object.assign(carousel.style, positionStyles);
          
          container.appendChild(carousel);
        } else {
          fetch(`${this.apiUrl}/products/${placement.productId}`)
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
            .then(product => {
              this.productCache.set(placement.productId, product);
              const carousel = this.createCarousel(product, video.carouselConfig, carouselId);
              
              // Apply position styles
              const positionStyles = this.getPositionStyles(video.carouselConfig.position);
              Object.assign(carousel.style, positionStyles);
              
              container.appendChild(carousel);
            })
            .catch(err => {
              console.error('Failed to load product:', err);
            });
        }
      });

      // Clean up scroll intervals for inactive carousels
      const allCarouselIds = Array.from(this.scrollStates.keys());
      allCarouselIds.forEach(id => {
        if (!activeCarouselIds.has(id)) {
          this.clearScrollState(id);
        }
      });
    },

    createCarousel: function(product, config, carouselId) {
      const carousel = document.createElement('div');
      carousel.style.position = 'absolute';
      carousel.dataset.carouselId = carouselId || 'default';
      
      // Background styling
      if (config.transparentBackground) {
        carousel.style.backgroundColor = 'transparent';
        carousel.style.backdropFilter = 'none';
      } else {
        carousel.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        carousel.style.backdropFilter = 'blur(10px)';
      }
      
      // Border styling
      if (config.showBorder) {
        carousel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        carousel.style.border = '1px solid rgba(0,0,0,0.1)';
      } else {
        carousel.style.boxShadow = 'none';
        carousel.style.border = 'none';
      }
      
      const padding = config.carouselPadding || 12;
      const thumbnailGap = config.thumbnailContentGap || 12;
      const buttonGap = config.contentButtonGap || 12;
      const thumbnailSize = config.thumbnailSize || 64;
      const carouselWidth = config.carouselWidth || 250;
      
      // Check if any content is displayed
      const hasContent = config.showTitle || config.showPrice || config.showDescription || config.showButton;
      
      // Calculate minimum carousel width based on content visibility
      // If content is shown, add gap + minimum content width (100px)
      // If no content, just ensure carousel fits thumbnail + padding
      const minCarouselWidth = hasContent 
        ? Math.max(carouselWidth, thumbnailSize + (padding * 2) + thumbnailGap + 100)
        : Math.max(carouselWidth, thumbnailSize + (padding * 2));
      
      carousel.style.padding = `${padding}px`;
      carousel.style.maxWidth = `${minCarouselWidth}px`;
      carousel.style.borderRadius = `${config.cornerRadius}px`;
      carousel.style.pointerEvents = 'auto';
      carousel.style.zIndex = '1000';
      
      // Add animation class
      carousel.className = 'shoppable-carousel';
      if (config.animation && config.animation !== 'none') {
        carousel.className += ` animation-${config.animation}`;
      }

      const positionStyles = this.getPositionStyles(config.position);
      Object.assign(carousel.style, positionStyles);

      const content = document.createElement('div');
      content.style.display = 'flex';
      content.style.gap = `${thumbnailGap}px`;

      const thumbnail = document.createElement('img');
      thumbnail.src = product.thumbnailUrl;
      thumbnail.alt = product.title;
      thumbnail.style.objectFit = 'cover';
      thumbnail.style.flexShrink = '0';
      
      const thumbnailStyles = this.getThumbnailStyles(config);
      Object.assign(thumbnail.style, thumbnailStyles);

      const info = document.createElement('div');
      info.style.flex = '1';
      info.style.minWidth = '0';
      info.style.display = 'flex';
      info.style.flexDirection = 'column';
      info.style.gap = '4px';

      // Handle scroll mode
      const enableScroll = config.enableScroll || false;
      let scrollIndex = 0;
      if (enableScroll && carouselId) {
        this.initScrollState(carouselId);
        scrollIndex = this.getScrollIndex(carouselId);
      }

      // Show title (either always or when scrollIndex === 0)
      if (config.showTitle && (!enableScroll || scrollIndex === 0)) {
        const title = document.createElement('p');
        title.textContent = product.title;
        title.style.fontSize = '14px';
        
        // Apply text animation
        const textAnimClass = this.getTextAnimationClass(config.textAnimation);
        if (textAnimClass) {
          title.className = textAnimClass;
        }
        
        // Apply font styles
        const titleFontStyle = config.titleFontStyle || 'normal';
        if (titleFontStyle === 'bold') {
          title.style.fontWeight = 'bold';
          title.style.fontStyle = 'normal';
        } else if (titleFontStyle === 'italic') {
          title.style.fontWeight = '600';
          title.style.fontStyle = 'italic';
        } else if (titleFontStyle === 'bold-italic') {
          title.style.fontWeight = 'bold';
          title.style.fontStyle = 'italic';
        } else {
          title.style.fontWeight = '600';
          title.style.fontStyle = 'normal';
        }
        
        title.style.fontFamily = this.getFontFamily(config.titleFontFamily);
        title.style.margin = '0';
        title.style.lineHeight = '1.4';
        title.style.color = config.titleColor || '#000';
        info.appendChild(title);
      }

      // Show price (either always or when scrollIndex === 1)
      if (config.showPrice && (!enableScroll || scrollIndex === 1)) {
        const price = document.createElement('p');
        price.textContent = product.price;
        price.style.fontSize = '14px';
        price.style.fontWeight = '600';
        price.style.margin = '0';
        price.style.color = config.priceColor || '#6366f1';
        price.style.fontFamily = this.getFontFamily(config.priceFontFamily);
        
        // Apply text animation
        const textAnimClass = this.getTextAnimationClass(config.textAnimation);
        if (textAnimClass) {
          price.className = textAnimClass;
        }
        
        info.appendChild(price);
      }
      
      // Show button text in info div when scrolling (scrollIndex === 2)
      if (enableScroll && scrollIndex === 2 && config.showButton) {
        const buttonText = document.createElement('span');
        buttonText.textContent = config.buttonText;
        buttonText.style.fontSize = '14px';
        buttonText.style.fontWeight = '600';
        buttonText.style.color = '#000';
        buttonText.style.fontFamily = this.getFontFamily(config.buttonFontFamily);
        
        // Apply text animation
        const textAnimClass = this.getTextAnimationClass(config.textAnimation);
        if (textAnimClass) {
          buttonText.className = textAnimClass;
        }
        
        info.appendChild(buttonText);
      }

      if (config.showDescription && product.description) {
        const description = document.createElement('p');
        description.textContent = product.description;
        description.style.fontSize = '12px';
        description.style.margin = '0';
        description.style.color = '#666';
        description.style.lineHeight = '1.4';
        info.appendChild(description);
      }

      // Create button if needed (but not when in scroll mode - button text is shown in info div)
      let button = null;
      if (config.showButton && !enableScroll) {
        button = document.createElement('a');
        button.href = product.url;
        button.target = '_blank';
        button.rel = 'noopener noreferrer';
        button.textContent = config.buttonText;
        button.style.display = 'inline-block';
        button.style.padding = '6px 12px';
        button.style.backgroundColor = config.buttonBackgroundColor;
        button.style.color = config.buttonTextColor;
        button.style.fontSize = `${config.buttonFontSize}px`;
        
        // Apply text animation
        const textAnimClass = this.getTextAnimationClass(config.textAnimation);
        if (textAnimClass) {
          button.className = textAnimClass;
        }
        
        // Apply font styles
        const buttonFontStyle = config.buttonFontStyle || 'normal';
        if (buttonFontStyle === 'bold') {
          button.style.fontWeight = 'bold';
          button.style.fontStyle = 'normal';
        } else if (buttonFontStyle === 'italic') {
          button.style.fontWeight = config.buttonFontWeight || '400';
          button.style.fontStyle = 'italic';
        } else if (buttonFontStyle === 'bold-italic') {
          button.style.fontWeight = 'bold';
          button.style.fontStyle = 'italic';
        } else {
          button.style.fontWeight = config.buttonFontWeight || '400';
          button.style.fontStyle = 'normal';
        }
        
        button.style.fontFamily = this.getFontFamily(config.buttonFontFamily);
        button.style.borderRadius = `${config.buttonBorderRadius}px`;
        button.style.textDecoration = 'none';
        button.style.cursor = 'pointer';
        button.style.border = 'none';
        button.style.whiteSpace = 'nowrap';
      }

      // Layout based on button position
      const buttonPos = config.buttonPosition || 'below';
      if (buttonPos === 'below') {
        // Button below entire content
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = `${buttonGap}px`;
        
        const contentRow = document.createElement('div');
        contentRow.style.display = 'flex';
        contentRow.style.gap = `${thumbnailGap}px`;
        contentRow.style.alignItems = 'flex-start';
        contentRow.appendChild(thumbnail);
        contentRow.appendChild(info);
        
        wrapper.appendChild(contentRow);
        if (button) {
          button.style.width = '100%';
          button.style.textAlign = 'center';
          wrapper.appendChild(button);
        }
        carousel.appendChild(wrapper);
      } else if (buttonPos === 'right') {
        // Button to the right of content
        content.appendChild(thumbnail);
        content.appendChild(info);
        carousel.appendChild(content);
        if (button) {
          button.style.alignSelf = 'center';
          const wrapper = document.createElement('div');
          wrapper.style.display = 'flex';
          wrapper.style.alignItems = 'center';
          wrapper.style.gap = `${buttonGap}px`;
          carousel.innerHTML = '';
          wrapper.appendChild(content);
          wrapper.appendChild(button);
          carousel.appendChild(wrapper);
        }
      } else if (buttonPos === 'left') {
        // Button to the left of content
        content.appendChild(thumbnail);
        content.appendChild(info);
        if (button) {
          button.style.alignSelf = 'center';
          const wrapper = document.createElement('div');
          wrapper.style.display = 'flex';
          wrapper.style.alignItems = 'center';
          wrapper.style.gap = `${buttonGap}px`;
          wrapper.appendChild(button);
          wrapper.appendChild(content);
          carousel.appendChild(wrapper);
        } else {
          carousel.appendChild(content);
        }
      } else if (buttonPos === 'top') {
        // Button above content
        if (button) {
          button.style.marginBottom = `${buttonGap}px`;
          button.style.display = 'block';
          button.style.width = '100%';
          button.style.textAlign = 'center';
          carousel.appendChild(button);
        }
        content.appendChild(thumbnail);
        content.appendChild(info);
        carousel.appendChild(content);
      } else {
        // Fallback to below
        content.appendChild(thumbnail);
        content.appendChild(info);
        if (button) {
          button.style.marginTop = `${buttonGap}px`;
          info.appendChild(button);
        }
        carousel.appendChild(content);
      }

      // Handle clicks - in scroll mode, entire carousel is clickable
      const trackAndOpen = (productId, url) => {
        this.trackAnalytics('product_click', productId);
        window.open(url, '_blank');
      };

      if (enableScroll || !config.showButton) {
        // Scroll mode or no button: make entire carousel clickable
        carousel.style.cursor = 'pointer';
        carousel.addEventListener('click', () => {
          trackAndOpen(product.id, product.url);
        });
      } else {
        // Normal mode with button
        carousel.style.cursor = 'default';
        const button = info.querySelector('a');
        if (button) {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            trackAndOpen(product.id, product.url);
          });
        }
      }

      return carousel;
    },

    getPositionStyles: function(position) {
      switch (position) {
        case 'top-right':
          return { top: '3px', right: '3px' };
        case 'top-center':
          return { top: '3px', left: '50%', transform: 'translateX(-50%)' };
        case 'top-left':
          return { top: '3px', left: '3px' };
        case 'side-right':
          return { right: '3px', top: '50%', transform: 'translateY(-50%)' };
        case 'side-left':
          return { left: '3px', top: '50%', transform: 'translateY(-50%)' };
        case 'bottom-right':
          return { bottom: '3px', right: '3px' };
        case 'bottom-center':
          return { bottom: '3px', left: '50%', transform: 'translateX(-50%)' };
        case 'bottom-left':
          return { bottom: '3px', left: '3px' };
        default:
          return { top: '3px', right: '3px' };
      }
    },

    getThumbnailStyles: function(config) {
      const size = config.thumbnailSize || 64;
      switch (config.thumbnailShape) {
        case 'circle':
          return { 
            width: `${size}px`, 
            height: `${size}px`, 
            borderRadius: '50%' 
          };
        case 'portrait':
          return { 
            width: `${size * 0.75}px`, 
            height: `${size}px`,
            borderRadius: `${config.cornerRadius}px`
          };
        case 'square':
        default:
          return { 
            width: `${size}px`, 
            height: `${size}px`,
            borderRadius: `${config.cornerRadius}px`
          };
      }
    }
  };
})();
