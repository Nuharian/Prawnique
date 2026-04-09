/**
 * Prawnique - Main JavaScript
 * Handles slider, animations, and dynamic content loading
 */

// Helper function to preserve line breaks in content
function formatContent(text) {
    if (!text) return '';
    // Convert line breaks to <br> tags and preserve paragraphs
    return text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadFooter(); // Load footer first
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
// LOAD FOOTER
// ============================================

async function loadFooter() {
    const footerPlaceholder = document.getElementById('footerPlaceholder');
    if (!footerPlaceholder) return;

    try {
        const response = await fetch('/footer.html');
        const html = await response.text();
        footerPlaceholder.innerHTML = html;
        
        // Wait a bit for DOM to update, then load settings to update logo
        setTimeout(() => {
            initNewsletterForm();
            loadSiteSettings(); // Reload settings to update footer logo
        }, 100);
    } catch (error) {
        console.error('Failed to load footer:', error);
    }
}

// ============================================
// NAVBAR
// ============================================

function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    // Always keep navbar visible and scrolled
    navbar.classList.add('scrolled');
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

    // Load testimonials
    loadTestimonials();

    // Load latest news
    loadLatestNews();
}

async function loadSiteSettings() {
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();

        console.log('Loaded settings:', settings);

        // Update logo on all pages
        const logoImages = document.querySelectorAll('.logo-image');
        if (settings.site_logo && logoImages.length > 0) {
            logoImages.forEach(img => {
                img.src = settings.site_logo;
            });
        }

        // Update favicon
        if (settings.site_logo) {
            const favicon = document.querySelector('link[rel="icon"]');
            if (favicon) {
                favicon.href = settings.site_logo;
            }
        }

        // Update about section image
        const aboutImage = document.getElementById('aboutImage');
        if (aboutImage && settings.about_section_image) {
            aboutImage.src = settings.about_section_image;
        }

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
        console.error('Error loading settings:', error);
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
        this.width = 1440; // Match SVG viewBox width
        this.height = 320; // Match SVG viewBox height
        this.time = 0;

        // Configuration for each wave layer
        this.layers = [
            { amplitude: 30, frequency: 0.005, speed: 0.04, phase: 0 },
            { amplitude: 25, frequency: 0.008, speed: 0.03, phase: 2 },
            { amplitude: 15, frequency: 0.012, speed: 0.02, phase: 4 }
        ];

        // No resize listener needed
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

            let pathData = `M -50 ${this.height}`; // Start bottom left, off-screen

            // Calculate points along the width extended beyond screen
            for (let x = -50; x <= this.width + 50; x += 10) {
                // Sine wave formula: y = A * sin(kx + wt + phi)
                const y = Math.sin(x * layer.frequency + this.time * layer.speed + layer.phase) * layer.amplitude;
                // Offset y to fill the bottom part properly
                // Raise the wave level further (smaller Y is higher up). Center around 100.
                const yPos = 100 + y;
                pathData += ` L ${x} ${yPos}`;
            }

            pathData += ` L ${this.width + 50} ${this.height} Z`; // Close path at bottom right, off-screen
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
        
        console.log('Loaded sections from API:', sections);
        console.log('Section keys:', Object.keys(sections));

        // Update Hero section
        if (sections.hero) {
            const heroTitle = document.getElementById('heroTitle');
            const heroSubtitle = document.getElementById('heroSubtitle');
            if (heroTitle && sections.hero.title) {
                heroTitle.textContent = sections.hero.title;
                console.log('Updated hero title to:', sections.hero.title);
            }
            if (heroSubtitle && sections.hero.subtitle) {
                heroSubtitle.textContent = sections.hero.subtitle;
                console.log('Updated hero subtitle to:', sections.hero.subtitle);
            }
        }

        // Update About section
        if (sections.about_preview) {
            const aboutTitle = document.getElementById('aboutTitle');
            const aboutContent = document.getElementById('aboutContent');
            
            if (aboutTitle) aboutTitle.textContent = sections.about_preview.title;
            if (aboutContent && sections.about_preview.content) {
                // Format content and wrap in paragraph tags
                aboutContent.innerHTML = '<p>' + formatContent(sections.about_preview.content) + '</p>';
            }
        }

        // Update Products Header
        if (sections.products_header) {
            console.log('Updating products header:', sections.products_header);
            updateSectionHeader('productsSection', sections.products_header);
        } else {
            console.warn('products_header section not found in API response');
        }

        // Update Features Header
        if (sections.features_header) {
            console.log('Updating features header:', sections.features_header);
            updateSectionHeader('featuresSection', sections.features_header);
        } else {
            console.warn('features_header section not found in API response');
        }

        // Update Feature Items
        updateFeatureItem('feature1', sections.feature_quality);
        updateFeatureItem('feature2', sections.feature_sustainable);
        updateFeatureItem('feature3', sections.feature_fresh);
        updateFeatureItem('feature4', sections.feature_delivery);

        // Update Testimonials Header
        if (sections.testimonials_header) {
            updateSectionHeader('testimonialsSection', sections.testimonials_header);
        }

        // Update News Header
        if (sections.news_header) {
            updateSectionHeader('newsSection', sections.news_header);
        }

        // Update CTA Section
        if (sections.cta_section) {
            const ctaTitle = document.querySelector('.cta-section h2');
            const ctaText = document.querySelector('.cta-section p');
            if (ctaTitle) ctaTitle.textContent = sections.cta_section.title;
            if (ctaText) ctaText.innerHTML = formatContent(sections.cta_section.content);
        }

        // Update Footer
        if (sections.footer_about) {
            const footerAbout = document.querySelector('.footer-about p');
            if (footerAbout) footerAbout.innerHTML = formatContent(sections.footer_about.content);
        }

        if (sections.footer_newsletter) {
            const newsletterTitle = document.querySelector('.footer-newsletter h4');
            const newsletterText = document.querySelector('.footer-newsletter p');
            if (newsletterTitle) newsletterTitle.textContent = sections.footer_newsletter.title;
            if (newsletterText) newsletterText.innerHTML = formatContent(sections.footer_newsletter.content);
        }

        if (sections.footer_tagline) {
            const tagline = document.querySelector('.footer-bottom p:last-child');
            if (tagline) tagline.innerHTML = formatContent(sections.footer_tagline.content);
        }
    } catch (error) {
        console.error('Error loading sections:', error);
        console.log('Using default sections');
    }
}

// Helper function to update section headers
function updateSectionHeader(sectionId, sectionData) {
    const section = document.getElementById(sectionId);
    if (!section || !sectionData) {
        console.warn('Section not found:', sectionId, sectionData);
        return;
    }

    const subtitle = section.querySelector('.section-subtitle');
    const title = section.querySelector('.section-header h2');
    const description = section.querySelector('.section-header p');

    // Use subtitle field for the small text above the title
    if (subtitle && sectionData.subtitle) {
        subtitle.textContent = sectionData.subtitle;
        console.log(`Updated ${sectionId} subtitle to:`, sectionData.subtitle);
    }
    
    // Use title field for the main heading
    if (title && sectionData.title) {
        title.textContent = sectionData.title;
        console.log(`Updated ${sectionId} title to:`, sectionData.title);
    }
    
    // Use content field for the description paragraph
    if (description && sectionData.content) {
        description.innerHTML = formatContent(sectionData.content);
        console.log(`Updated ${sectionId} description to:`, sectionData.content);
    }
}

// Helper function to update feature items
function updateFeatureItem(featureId, featureData) {
    const feature = document.getElementById(featureId);
    if (!feature || !featureData) {
        console.warn('Feature not found:', featureId, featureData);
        return;
    }

    const title = feature.querySelector('h3');
    const description = feature.querySelector('p');

    if (title && featureData.title) {
        title.textContent = featureData.title;
        console.log(`Updated ${featureId} title to:`, featureData.title);
    }
    
    if (description && featureData.content) {
        description.innerHTML = formatContent(featureData.content);
        console.log(`Updated ${featureId} description to:`, featureData.content);
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
    const description = formatContent(product.short_description || '');
    return `
    <a href="/product.html?slug=${product.slug}" class="card product-card" style="text-decoration: none; color: inherit; display: block;">
      <div class="card-image">
        <img src="${image}" alt="${product.name}" loading="lazy">
        <div class="card-overlay"></div>
        <div class="card-cta">
          <i class="fas fa-arrow-right"></i>
        </div>
      </div>
      <div class="card-content">
        <h4 class="card-title">${product.name}</h4>
        <p class="card-text">${description}</p>
      </div>
    </a>
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

async function loadTestimonials() {
    const container = document.getElementById('testimonialsList');
    if (!container) return;

    try {
        // Add cache-busting parameter to force fresh data
        const response = await fetch('/api/testimonials?_=' + Date.now());
        const testimonials = await response.json();

        // Filter featured testimonials or take first 3
        const featured = testimonials.filter(t => t.is_featured).slice(0, 3);
        const toShow = featured.length > 0 ? featured : testimonials.slice(0, 3);

        if (toShow.length > 0) {
            container.innerHTML = toShow.map(t => createTestimonialCard(t)).join('');
        }
        // Otherwise keep default HTML content
    } catch (error) {
        console.log('Using default testimonials');
    }
}

function createTestimonialCard(testimonial) {
    const stars = '<i class="fas fa-star"></i>'.repeat(testimonial.rating || 5);
    const image = testimonial.image_path || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face';
    const content = formatContent(testimonial.content);

    return `
        <div class="testimonial-card">
            <div class="testimonial-stars">${stars}</div>
            <p class="testimonial-content">"${content}"</p>
            <div class="testimonial-author">
                <img src="${image}" alt="${testimonial.client_name}" loading="lazy">
                <div class="testimonial-author-info">
                    <h4>${testimonial.client_name}</h4>
                    <span>${testimonial.position || ''}${testimonial.position && testimonial.company ? ', ' : ''}${testimonial.company || ''}</span>
                </div>
            </div>
        </div>
    `;
}

function createNewsCard(post) {
    const image = post.featured_image || 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=250&fit=crop';
    const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const excerpt = formatContent(post.excerpt || '');

    return `
    <a href="/news-detail.html?slug=${post.slug}" class="card news-card news-card-link" style="text-decoration: none; color: inherit; display: block;">
      <div class="card-image">
        <img src="${image}" alt="${post.title}" loading="lazy">
      </div>
      <div class="card-content">
        <div class="card-meta">
          <span class="card-date"><i class="far fa-calendar"></i> ${date}</span>
        </div>
        <h4 class="card-title">${post.title}</h4>
        <p class="card-excerpt">${excerpt}</p>
        <span class="read-more">Read More <i class="fas fa-arrow-right"></i></span>
      </div>
    </a>
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
