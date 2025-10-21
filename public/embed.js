(function() {
  window.ShoppableVideo = {
    init: function(options) {
      const { containerId, videoId, apiUrl } = options;
      const container = document.getElementById(containerId);
      
      if (!container) {
        console.error('Shoppable Video: Container not found');
        return;
      }

      fetch(`${apiUrl}/videos/${videoId}`)
        .then(res => res.json())
        .then(video => {
          this.renderPlayer(container, video);
        })
        .catch(err => {
          console.error('Shoppable Video: Failed to load video', err);
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
        fetch(`${window.location.origin}/api/products/${placement.productId}`)
          .then(res => res.json())
          .then(product => {
            const carousel = this.createCarousel(product, video.carouselConfig);
            container.appendChild(carousel);
          });
      });
    },

    createCarousel: function(product, config) {
      const carousel = document.createElement('div');
      carousel.style.position = 'absolute';
      carousel.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      carousel.style.backdropFilter = 'blur(10px)';
      carousel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      carousel.style.padding = '12px';
      carousel.style.maxWidth = '320px';
      carousel.style.borderRadius = `${config.cornerRadius}px`;
      carousel.style.pointerEvents = 'auto';
      carousel.style.zIndex = '1000';

      const positionStyles = this.getPositionStyles(config.position);
      Object.assign(carousel.style, positionStyles);

      const content = document.createElement('div');
      content.style.display = 'flex';
      content.style.gap = '12px';

      const thumbnail = document.createElement('img');
      thumbnail.src = product.thumbnailUrl;
      thumbnail.alt = product.title;
      thumbnail.style.objectFit = 'cover';
      thumbnail.style.borderRadius = `${config.cornerRadius}px`;
      
      const thumbnailStyles = this.getThumbnailStyles(config.thumbnailShape);
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
        title.style.fontWeight = '600';
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

      if (config.showButton) {
        const button = document.createElement('a');
        button.href = product.url;
        button.target = '_blank';
        button.rel = 'noopener noreferrer';
        button.textContent = config.buttonText;
        button.style.display = 'inline-block';
        button.style.padding = '6px 12px';
        button.style.marginTop = '8px';
        button.style.backgroundColor = config.buttonBackgroundColor;
        button.style.color = config.buttonTextColor;
        button.style.fontSize = `${config.buttonFontSize}px`;
        button.style.fontWeight = config.buttonFontWeight;
        button.style.borderRadius = `${config.buttonBorderRadius}px`;
        button.style.textDecoration = 'none';
        button.style.cursor = 'pointer';
        button.style.border = 'none';
        info.appendChild(button);
      }

      content.appendChild(thumbnail);
      content.appendChild(info);
      carousel.appendChild(content);

      carousel.style.cursor = config.showButton ? 'default' : 'pointer';
      if (!config.showButton) {
        carousel.addEventListener('click', () => {
          window.open(product.url, '_blank');
        });
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

    getThumbnailStyles: function(shape) {
      switch (shape) {
        case 'circle':
          return { width: '64px', height: '64px', borderRadius: '50%' };
        case 'portrait':
          return { width: '48px', height: '64px' };
        case 'square':
        default:
          return { width: '64px', height: '64px' };
      }
    }
  };
})();
