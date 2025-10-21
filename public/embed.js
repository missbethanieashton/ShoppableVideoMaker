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
      
      .shoppable-carousel.animation-hover {
        animation: slow-drift 6s ease-in-out infinite;
      }
      
      .shoppable-carousel.animation-float {
        animation: gentle-float 3s ease-in-out infinite;
      }
      
      .shoppable-carousel.animation-pulse {
        animation: soft-pulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  window.ShoppableVideo = {
    apiUrl: null,
    videoId: null,
    viewTracked: false,
    productCache: new Map(),

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

      activePlacements.forEach(placement => {
        if (this.productCache.has(placement.productId)) {
          const product = this.productCache.get(placement.productId);
          const carousel = this.createCarousel(product, video.carouselConfig);
          container.appendChild(carousel);
        } else {
          fetch(`${this.apiUrl}/products/${placement.productId}`)
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
            .then(product => {
              this.productCache.set(placement.productId, product);
              const carousel = this.createCarousel(product, video.carouselConfig);
              container.appendChild(carousel);
            })
            .catch(err => {
              console.error('Failed to load product:', err);
            });
        }
      });
    },

    createCarousel: function(product, config) {
      const carousel = document.createElement('div');
      carousel.style.position = 'absolute';
      
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
      
      carousel.style.padding = `${padding}px`;
      carousel.style.maxWidth = `${config.carouselWidth || 250}px`;
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
      
      const thumbnailStyles = this.getThumbnailStyles(config);
      Object.assign(thumbnail.style, thumbnailStyles);

      const info = document.createElement('div');
      info.style.flex = '1';
      info.style.minWidth = '0';
      info.style.display = 'flex';
      info.style.flexDirection = 'column';
      info.style.gap = '4px';

      if (config.showTitle) {
        const title = document.createElement('p');
        title.textContent = product.title;
        title.style.fontSize = '14px';
        
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
        title.style.color = '#000';
        info.appendChild(title);
      }

      if (config.showPrice) {
        const price = document.createElement('p');
        price.textContent = product.price;
        price.style.fontSize = '14px';
        price.style.fontWeight = '600';
        price.style.margin = '0';
        price.style.color = '#6366f1';
        price.style.fontFamily = this.getFontFamily(config.priceFontFamily);
        info.appendChild(price);
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

      // Create button if needed
      let button = null;
      if (config.showButton) {
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

      carousel.style.cursor = config.showButton ? 'default' : 'pointer';
      
      const trackAndOpen = (productId, url) => {
        this.trackAnalytics('product_click', productId);
        window.open(url, '_blank');
      };

      if (!config.showButton) {
        carousel.addEventListener('click', () => {
          trackAndOpen(product.id, product.url);
        });
      } else {
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
          return { top: '16px', right: '16px' };
        case 'top-center':
          return { top: '16px', left: '50%', transform: 'translateX(-50%)' };
        case 'top-left':
          return { top: '16px', left: '16px' };
        case 'side-right':
          return { right: '16px', top: '50%', transform: 'translateY(-50%)' };
        case 'side-left':
          return { left: '16px', top: '50%', transform: 'translateY(-50%)' };
        case 'bottom-right':
          return { bottom: '16px', right: '16px' };
        case 'bottom-center':
          return { bottom: '16px', left: '50%', transform: 'translateX(-50%)' };
        case 'bottom-left':
          return { bottom: '16px', left: '16px' };
        default:
          return { top: '16px', right: '16px' };
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
