/**
 * Prawnique - Main JavaScript
 * Handles slider, animations, and dynamic content loading
 */

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initMobileMenu();
    initSlider();
    initScrollAnimations();
    initBackToTop();
    initCounterAnimation();
    initNewsletterForm();
    loadDynamicContent();
});

// ============================================
// NAVBAR
// ============================================

function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

function initMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        toggle.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            toggle.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !toggle.contains(e.target)) {
            navLinks.classList.remove('active');
            toggle.classList.remove('active');
        }
    });
}

// ============================================
// HERO SLIDER
// ============================================

let currentSlide = 0;
let slideInterval = null;
let sliderImages = [];

function initSlider() {
    const sliderContainer = document.getElementById('heroSlider');
    const sliderNav = document.getElementById('sliderNav');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');

    if (!sliderContainer) return;

    // Load slider images from API
    loadSliderImages();

    // Navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            goToSlide(currentSlide - 1);
            resetSlideInterval();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToSlide(currentSlide + 1);
            resetSlideInterval();
        });
    }

    // Auto-play
    startSlideInterval();

    // Pause on hover
    sliderContainer.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });

    sliderContainer.addEventListener('mouseleave', () => {
        startSlideInterval();
    });
}

async function loadSliderImages() {
    try {
        const response = await fetch('/api/slider');
        sliderImages = await response.json();

        if (sliderImages.length > 0) {
            renderSlider();
        }
    } catch (error) {
        console.log('Using default slider');
        // Use default placeholder - already in HTML
    }
}

function renderSlider() {
    const sliderContainer = document.getElementById('heroSlider');
    const sliderNav = document.getElementById('sliderNav');
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');

    if (!sliderContainer || sliderImages.length === 0) return;

    // Clear existing slides
    sliderContainer.innerHTML = '';
    if (sliderNav) sliderNav.innerHTML = '';

    // Create slides
    sliderImages.forEach((image, index) => {
        const slide = document.createElement('div');
        slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
        slide.innerHTML = `<img src="${image.image_path}" alt="${image.title || 'Prawnique'}" loading="${index === 0 ? 'eager' : 'lazy'}">`;
        sliderContainer.appendChild(slide);

        // Create nav dot
        if (sliderNav) {
            const dot = document.createElement('button');
            dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
            dot.addEventListener('click', () => {
                goToSlide(index);
                resetSlideInterval();
            });
            sliderNav.appendChild(dot);
        }
    });

    // Update hero content with first slide info
    if (sliderImages[0].title && heroTitle) {
        heroTitle.textContent = sliderImages[0].title;
    }
    if (sliderImages[0].subtitle && heroSubtitle) {
        heroSubtitle.textContent = sliderImages[0].subtitle;
    }
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.slider-dot');
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');

    if (slides.length === 0) return;

    // Wrap around
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;

    // Update slides
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });

    // Update dots
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // Update content if slider images have titles
    if (sliderImages[index]) {
        if (sliderImages[index].title && heroTitle) {
            heroTitle.textContent = sliderImages[index].title;
        }
        if (sliderImages[index].subtitle && heroSubtitle) {
            heroSubtitle.textContent = sliderImages[index].subtitle;
        }
    }

    currentSlide = index;
}

function startSlideInterval() {
    slideInterval = setInterval(() => {
        goToSlide(currentSlide + 1);
    }, 5000);
}

function resetSlideInterval() {
    clearInterval(slideInterval);
    startSlideInterval();
}

// ============================================
// SCROLL ANIMATIONS
// ============================================

function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .scale-in, .stagger-in');

    if (animatedElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
}

// ============================================
// BACK TO TOP
// ============================================

function initBackToTop() {
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================
// COUNTER ANIMATION
// ============================================

function initCounterAnimation() {
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'), 10);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
    }, 16);
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'k';
    }
    return num.toString();
}

// ============================================
// NEWSLETTER FORM
// ============================================

function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        const button = form.querySelector('button');
        const originalText = button.textContent;

        button.textContent = 'Subscribing...';
        button.disabled = true;

        try {
            const response = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                button.textContent = 'Subscribed!';
                form.reset();
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 3000);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            button.textContent = 'Error!';
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 2000);
        }
    });
}

// ============================================
// DYNAMIC CONTENT LOADING
// ============================================

async function loadDynamicContent() {
    // Load site settings
    loadSiteSettings();

    // Load sections
    loadSections();

    // Load featured products
    loadFeaturedProducts();

    // Load latest news
    loadLatestNews();
}

async function loadSiteSettings() {
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();

        // Wave Animation Toggle
        const animationType = settings.wave_animation_type || 'realistic';
        initWaveAnimation(animationType);

        // Update footer text
        const footerText = document.getElementById('footerText');
        if (footerText && settings.footer_text) {
            footerText.textContent = settings.footer_text;
        }

        // Update social links
        updateSocialLinks(settings);
    } catch (error) {
        console.log('Using default settings');
        initWaveAnimation('realistic');
    }
}

// ============================================
// WAVE ANIMATION CONTROLLER
// ============================================

let waveController = null;

function initWaveAnimation(type) {
    const classicLayer = document.getElementById('waveClassic');
    const realisticLayer = document.getElementById('waveRealistic');

    if (type === 'realistic') {
        if (classicLayer) classicLayer.style.display = 'none';
        if (realisticLayer) realisticLayer.style.display = 'block';

        if (!waveController) {
            waveController = new WaveController();
        }
        waveController.start();
    } else {
        if (classicLayer) classicLayer.style.display = 'block';
        if (realisticLayer) realisticLayer.style.display = 'none';

        if (waveController) {
            waveController.stop();
        }
    }
}

class WaveController {
    constructor() {
        this.svg = document.getElementById('waveRealistic');
        this.paths = [
            document.getElementById('wavePath1'),
            document.getElementById('wavePath2'),
            document.getElementById('wavePath3')
        ];
        this.running = false;
        this.width = window.innerWidth;
        this.height = 320; // Match SVG viewBox height
        this.time = 0;

        // Configuration for each wave layer
        this.layers = [
            { amplitude: 30, frequency: 0.005, speed: 0.04, phase: 0 },
            { amplitude: 25, frequency: 0.008, speed: 0.03, phase: 2 },
            { amplitude: 15, frequency: 0.012, speed: 0.02, phase: 4 }
        ];

        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
        });
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.animate();
    }

    stop() {
        this.running = false;
    }

    animate() {
        if (!this.running) return;

        this.time += 1;

        this.layers.forEach((layer, index) => {
            if (!this.paths[index]) return;

            let pathData = `M 0 ${this.height}`; // Start bottom left

            // Calculate points along the width
            for (let x = 0; x <= this.width; x += 10) {
                // Sine wave formula: y = A * sin(kx + wt + phi)
                const y = Math.sin(x * layer.frequency + this.time * layer.speed + layer.phase) * layer.amplitude;
                // Offset y to fill the bottom part properly
                // Raise the wave level (smaller Y is higher up). Center around 150.
                const yPos = 150 + y;
                pathData += ` L ${x} ${yPos}`;
            }

            pathData += ` L ${this.width} ${this.height} Z`; // Close path
            this.paths[index].setAttribute('d', pathData);
        });

        requestAnimationFrame(() => this.animate());
    }
}

function updateSocialLinks(settings) {
    const socialLinks = document.querySelectorAll('.contact-social a, .footer-about .contact-social a');
    socialLinks.forEach(link => {
        const icon = link.querySelector('i');
        if (!icon) return;

        if (icon.classList.contains('fa-facebook-f') && settings.facebook_url) {
            link.href = settings.facebook_url;
        } else if (icon.classList.contains('fa-twitter') && settings.twitter_url) {
            link.href = settings.twitter_url;
        } else if (icon.classList.contains('fa-instagram') && settings.instagram_url) {
            link.href = settings.instagram_url;
        } else if (icon.classList.contains('fa-linkedin-in') && settings.linkedin_url) {
            link.href = settings.linkedin_url;
        }
    });
}

async function loadSections() {
    try {
        const response = await fetch('/api/sections');
        const sections = await response.json();

        // Update About section
        if (sections.about_preview) {
            const aboutTitle = document.getElementById('aboutTitle');
            const aboutContent = document.getElementById('aboutContent');
            if (aboutTitle) aboutTitle.textContent = sections.about_preview.title;
            if (aboutContent) aboutContent.textContent = sections.about_preview.content;
        }
    } catch (error) {
        console.log('Using default sections');
    }
}

async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    try {
        const response = await fetch('/api/products?featured=true');
        const products = await response.json();

        if (products.length > 0) {
            container.innerHTML = products.slice(0, 4).map(product => createProductCard(product)).join('');
        } else {
            // Load all products if no featured ones
            const allResponse = await fetch('/api/products');
            const allProducts = await allResponse.json();

            if (allProducts.length > 0) {
                container.innerHTML = allProducts.slice(0, 4).map(product => createProductCard(product)).join('');
            } else {
                container.innerHTML = getDefaultProductCards();
            }
        }
    } catch (error) {
        container.innerHTML = getDefaultProductCards();
    }
}

function createProductCard(product) {
    const image = product.featured_image || 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=300&fit=crop';
    return `
    <div class="card product-card">
      <div class="card-image">
        <span class="card-category">${product.category_name || 'Premium'}</span>
        <img src="${image}" alt="${product.name}" loading="lazy">
        <div class="card-overlay"></div>
        <a href="/product.html?slug=${product.slug}" class="card-cta">
          <i class="fas fa-arrow-right"></i>
        </a>
      </div>
      <div class="card-content">
        <h4 class="card-title">${product.name}</h4>
        <p class="card-text">${product.short_description || ''}</p>
      </div>
    </div>
  `;
}

function getDefaultProductCards() {
    const defaults = [
        { name: 'Black Tiger Shrimp', category: 'Premium', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=300&fit=crop', desc: 'Premium quality Black Tiger from Bangladesh' },
        { name: 'Freshwater King Prawn', category: 'Premium', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop', desc: 'Giant river prawns, naturally grown' },
        { name: 'Vannamei Shrimp', category: 'Popular', image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&h=300&fit=crop', desc: 'Pacific white shrimp, versatile and delicious' },
        { name: 'Cat Tiger Shrimp', category: 'Specialty', image: 'https://images.unsplash.com/photo-1606731219412-16c08a5f3193?w=400&h=300&fit=crop', desc: 'Rainbow shrimp with unique flavor' }
    ];

    return defaults.map(p => `
    <div class="card product-card">
      <div class="card-image">
        <span class="card-category">${p.category}</span>
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <div class="card-overlay"></div>
        <a href="/products.html" class="card-cta">
          <i class="fas fa-arrow-right"></i>
        </a>
      </div>
      <div class="card-content">
        <h4 class="card-title">${p.name}</h4>
        <p class="card-text">${p.desc}</p>
      </div>
    </div>
  `).join('');
}

async function loadLatestNews() {
    const container = document.getElementById('latestNews');
    if (!container) return;

    try {
        const response = await fetch('/api/news?limit=3');
        const data = await response.json();

        if (data.posts && data.posts.length > 0) {
            container.innerHTML = data.posts.map(post => createNewsCard(post)).join('');
        }
        // Otherwise keep default HTML content
    } catch (error) {
        console.log('Using default news');
    }
}

function createNewsCard(post) {
    const image = post.featured_image || 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=250&fit=crop';
    const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    return `
    <div class="card news-card">
      <div class="card-image">
        <img src="${image}" alt="${post.title}" loading="lazy">
      </div>
      <div class="card-content">
        <div class="card-meta">
          <span class="card-date"><i class="far fa-calendar"></i> ${date}</span>
        </div>
        <h4 class="card-title">${post.title}</h4>
        <p class="card-excerpt">${post.excerpt || ''}</p>
        <a href="/news-detail.html?slug=${post.slug}" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
      </div>
    </div>
  `;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? 'var(--seafoam)' : 'var(--coral)'};
    color: ${type === 'success' ? 'var(--deep-ocean)' : 'white'};
    padding: 1rem 2rem;
    border-radius: 50px;
    font-weight: 600;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    z-index: 9999;
    animation: slideUp 0.3s ease;
  `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add slide animations to head
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(100px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
  @keyframes slideDown {
    from { transform: translateX(-50%) translateY(0); opacity: 1; }
    to { transform: translateX(-50%) translateY(100px); opacity: 0; }
  }
`;
document.head.appendChild(style);
