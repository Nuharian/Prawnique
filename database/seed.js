/**
 * Prawnique - Shared seed data
 *
 * Both the Vercel Postgres and the local SQLite paths seed from this file so the
 * two environments stay at parity. Every piece of copy that appears on the public
 * site should have a row here, which is what makes it editable from /admin.
 */

// [key, value]
const settings = [
    ['site_name', 'Prawnique'],
    ['site_tagline', 'Premium Prawns, Naturally Sourced'],
    ['site_logo', '/img/logo.png'],
    ['about_section_image', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&h=500&fit=crop'],
    ['about_story_image', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=500&fit=crop'],
    ['contact_email', 'info@prawnique.com'],
    ['contact_phone', '+880 1XXX-XXXXXX'],
    ['contact_address', 'Dhaka, Bangladesh'],
    ['contact_map_embed', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d233667.49930078043!2d90.25487249685775!3d23.780975728160795!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b087026b81%3A0x8fa563bbdd5904c2!2sDhaka%2C%20Bangladesh!5e0!3m2!1sen!2sus!4v1706000000000!5m2!1sen!2sus'],
    ['facebook_url', ''],
    ['twitter_url', ''],
    ['instagram_url', ''],
    ['linkedin_url', ''],
    ['footer_text', '© 2026 Prawnique. All rights reserved.'],
    // Wave / intro animation controls
    ['wave_animation_type', 'realistic'],
    ['intro_animation_enabled', 'true'],
    ['intro_animation_duration', '3200'],
    ['intro_animation_tagline', 'Premium Prawns, Naturally Sourced'],
    ['intro_animation_once_per_session', 'false']
];

// [name, slug, description, display_order]
const categories = [
    ['Black Tiger Shrimp', 'black-tiger-shrimp', 'Premium Black Tiger Shrimp', 0],
    ['Freshwater Prawns', 'freshwater-prawns', 'Giant Freshwater King Prawns', 1],
    ['Vannamei Shrimp', 'vannamei-shrimp', 'Pacific White Shrimp', 2],
    ['Specialty Prawns', 'specialty-prawns', 'Rare and specialty varieties', 3]
];

// { key, title, subtitle, content, image_path, icon, button_text, button_link }
const sections = [
    // ---------- Homepage ----------
    {
        key: 'hero',
        title: 'Premium Prawns, Naturally Sourced',
        subtitle: 'From the pristine waters of Bangladesh to your table — experience the finest quality prawns cultivated with care and delivered with excellence.',
        button_text: 'Explore Products',
        button_link: '/products.html'
    },
    {
        key: 'hero_secondary_button',
        title: 'Hero Secondary Button',
        button_text: 'Contact Us',
        button_link: '/contact.html'
    },
    {
        key: 'about_preview',
        title: 'Your Trusted Seafood Partner',
        subtitle: 'About Us',
        content: 'We are dedicated to providing the highest quality prawns.',
        image_path: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&h=500&fit=crop',
        button_text: 'Learn More About Us',
        button_link: '/about.html'
    },
    {
        key: 'products_header',
        title: 'Premium Seafood Selection',
        subtitle: 'Our Products',
        content: 'Discover our range of premium prawns and seafood, sourced responsibly and processed with care.',
        button_text: 'View All Products',
        button_link: '/products.html'
    },
    {
        key: 'features_header',
        title: 'The Prawnique Difference',
        subtitle: 'Why Choose Us',
        content: 'Quality you can trust, freshness you can taste.'
    },
    { key: 'feature_quality', title: 'Premium Quality', content: 'Only the finest prawns make it through our rigorous quality control process.', icon: 'fas fa-award' },
    { key: 'feature_sustainable', title: 'Sustainably Sourced', content: 'Our farms follow eco-friendly practices to protect marine ecosystems.', icon: 'fas fa-leaf' },
    { key: 'feature_fresh', title: 'Fresh Frozen', content: 'Flash-frozen at peak freshness to lock in flavor and nutrients.', icon: 'fas fa-snowflake' },
    { key: 'feature_delivery', title: 'Global Delivery', content: 'We export to over 50 countries with reliable cold-chain logistics.', icon: 'fas fa-globe' },
    {
        key: 'testimonials_header',
        title: 'What Our Clients Say',
        subtitle: 'Testimonials',
        content: 'Trusted by seafood importers and distributors worldwide.'
    },
    {
        key: 'news_header',
        title: 'From Our Blog',
        subtitle: 'Latest News',
        content: 'Stay updated with industry news and company updates.',
        button_text: 'View All News',
        button_link: '/news.html'
    },
    {
        key: 'cta_section',
        title: 'Ready to Partner With Us?',
        content: 'Get in touch today to discuss your seafood requirements. We offer competitive pricing, reliable supply, and exceptional quality.',
        button_text: 'Get In Touch',
        button_link: '/contact.html'
    },

    // ---------- Page headers (the banner at the top of each inner page) ----------
    { key: 'page_header_about', title: 'About Prawnique', content: 'Your trusted partner for premium quality prawns and seafood from Bangladesh.' },
    { key: 'page_header_products', title: 'Our Products', content: 'Explore our range of premium prawns and seafood, sustainably sourced and rigorously quality checked.' },
    { key: 'page_header_team', title: 'Our Team', content: 'Meet the people behind Prawnique.' },
    { key: 'page_header_news', title: 'News & Updates', content: 'Industry insights, company news and stories from our farms.' },
    { key: 'page_header_gallery', title: 'Gallery', content: 'A look inside our farms, facilities and products.' },
    { key: 'page_header_contact', title: 'Contact Us', content: 'We would love to hear from you. Reach out and our team will respond within one business day.' },

    // ---------- About page ----------
    {
        key: 'about_story',
        title: 'Bringing the Best of Bangladesh\'s Seafood to the World',
        subtitle: 'Our Story',
        content: 'Founded with a vision to showcase Bangladesh\'s exceptional prawn and seafood industry to the global market, Prawnique has grown to become a trusted name in quality seafood exports.\n\nOur journey began in the coastal regions of Bangladesh, where generations of fishing communities have honed their craft. We partner directly with these skilled farmers and fishermen to bring you the freshest, most sustainably sourced prawns available.\n\nToday, we export to over 50 countries, maintaining our commitment to quality, sustainability, and fair partnerships with local communities.'
    },
    { key: 'about_mission', title: 'Our Mission', content: 'To deliver premium, sustainably sourced prawns and seafood while supporting local fishing communities and preserving marine ecosystems for future generations.', icon: 'fas fa-bullseye' },
    { key: 'about_vision', title: 'Our Vision', content: 'To be the world\'s most trusted seafood partner, recognized for exceptional quality, ethical practices, and positive impact on communities and environment.', icon: 'fas fa-eye' },
    { key: 'about_values_header', title: 'What Drives Us', subtitle: 'Our Values' },
    { key: 'about_value_1', title: 'Quality First', content: 'We never compromise on quality. Every product passes rigorous testing before reaching our customers.', icon: 'fas fa-gem' },
    { key: 'about_value_2', title: 'Fair Partnerships', content: 'We believe in fair trade and work directly with local farmers to ensure they receive fair compensation.', icon: 'fas fa-handshake' },
    { key: 'about_value_3', title: 'Sustainability', content: 'Environmental responsibility is at our core. We follow sustainable practices in all our operations.', icon: 'fas fa-leaf' },
    { key: 'about_value_4', title: 'Transparency', content: 'We maintain complete transparency in our supply chain, from farm to your table.', icon: 'fas fa-check-double' },
    {
        key: 'about_certifications_header',
        title: 'Quality You Can Trust',
        subtitle: 'Certifications',
        content: 'Our facilities and products are certified by leading international bodies.'
    },
    { key: 'about_cert_1', title: 'HACCP', content: 'HACCP Certified' },
    { key: 'about_cert_2', title: 'BAP', content: 'BAP Certified' },
    { key: 'about_cert_3', title: 'EU', content: 'EU Approved' },
    { key: 'about_cert_4', title: 'ISO', content: 'ISO 22000' },
    {
        key: 'about_cta',
        title: 'Ready to Partner With Us?',
        content: 'Contact us to learn more about our products and how we can serve your seafood needs.',
        button_text: 'Get In Touch',
        button_link: '/contact.html'
    },

    // ---------- Products page ----------
    {
        key: 'products_cta',
        title: 'Interested in Our Products?',
        content: 'Get in touch for pricing, specifications and export documentation.',
        button_text: 'Request a Quote',
        button_link: '/contact.html'
    },

    // ---------- Team page ----------
    { key: 'team_header', title: 'Excellence Through Expertise', subtitle: 'Our Team', content: 'A dedicated team of aquaculture specialists, quality controllers and export professionals.' },

    // ---------- Contact page ----------
    { key: 'contact_info_header', title: 'Get In Touch', content: 'Our team is available Sunday to Thursday, 9am – 6pm (GMT+6).' },
    { key: 'contact_form_header', title: 'Send Us a Message', content: '' },

    // ---------- Footer ----------
    { key: 'footer_about', title: 'About Footer', content: 'Your trusted partner for premium quality prawns and seafood products. Sustainably sourced from the coastal waters of Bangladesh.' },
    { key: 'footer_quicklinks', title: 'Quick Links' },
    { key: 'footer_products', title: 'Products' },
    { key: 'footer_newsletter', title: 'Newsletter', content: 'Subscribe to get the latest news and offers.' },
    { key: 'footer_tagline', title: 'Footer Tagline', content: 'Designed with 💙 for seafood lovers' }
];

// Team members seeded for the site launch. Inserted by name only when that name
// is not already present, so edits and deletions made in the admin panel stick.
// Photos are uploaded through Admin -> Team Members; an empty image_path falls
// back to a neutral placeholder rather than a broken image.
// [name, position, bio, image_path, email, phone, linkedin, display_order]
const team = [
    [
        'Rafiqul Islam',
        'Head of Aquaculture & Farm Partnerships',
        'Rafiqul works directly with the farming families who supply Prawnique across the southern delta, from Khulna and Bagerhat down to Satkhira. He advises partner farms on pond management, stocking density, feed and water quality, and leads our programme to keep production sustainable and fully traceable back to the pond it came from.',
        '',
        'rafiqul@prawnique.com',
        '',
        '',
        1
    ],
    [
        'Hasan Chowdhury',
        'Director of Operations & Supply Chain',
        'Hasan oversees everything between harvest and vessel: intake, grading, processing schedules and the cold chain that holds our product at temperature all the way to the port. He coordinates our processing facilities and freight partners so that shipments leave on time and arrive in the condition our buyers expect.',
        '',
        'hasan@prawnique.com',
        '',
        '',
        2
    ],
    [
        'Shahidul Islam Shahid',
        'Head of International Sales & Business Development',
        'Shahidul builds and manages Prawnique\'s relationships with importers, distributors and retail buyers across Europe, Asia and North America. He handles pricing, contract negotiation and export documentation, and is usually the first person a new buyer speaks to about specifications, volumes and lead times.',
        '',
        'shahidul@prawnique.com',
        '',
        '',
        3
    ],
    [
        'Asif Ahmed',
        'Quality Assurance & Food Safety Manager',
        'Asif runs our HACCP and BAP compliance programme and the laboratory checks behind it. Every consignment passes his team\'s inspection for size grading, cold-chain integrity, microbiological safety and antibiotic residue before it is cleared for export, and he maintains the certification records our international buyers audit against.',
        '',
        'asif@prawnique.com',
        '',
        '',
        4
    ]
];

// [client_name, company, position, content, rating, image_path, is_featured, display_order]
const testimonials = [
    ['James Wilson', 'Seafood Imports Ltd', 'Managing Director, UK', 'Prawnique has been our trusted supplier for over 5 years. Their consistency in quality and timely deliveries have made them an invaluable partner.', 5, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', true, 0],
    ['Yuki Tanaka', 'Tokyo Seafood Co.', 'CEO, Japan', 'The quality of their Black Tiger Shrimp is exceptional. Our customers in Japan appreciate the freshness and taste. Highly recommended!', 5, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', true, 1],
    ['Michael Schmidt', 'Euro Foods GmbH', 'Procurement Manager, Germany', 'Professional team, excellent communication, and top-notch products. Prawnique understands what international buyers need.', 5, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', true, 2]
];

// [slug, title, excerpt, content, featured_image, author, is_published]
const news = [
    ['sustainable-prawn-farming-bangladesh', 'Sustainable Prawn Farming: Leading the Way in Bangladesh', 'Our commitment to eco-friendly aquaculture practices is setting new standards in the industry.', 'Bangladesh has emerged as a global leader in sustainable prawn farming, with innovative techniques that protect marine ecosystems while delivering premium quality seafood.\n\nOur farms utilize advanced water management systems, natural feed supplements, and strict environmental monitoring to ensure minimal impact on local waterways. This approach not only preserves the delicate coastal ecosystem but also produces prawns with superior taste and nutritional value.\n\nThe integration of traditional farming wisdom with modern technology has created a model that other countries are now studying and implementing.', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop', 'Prawnique Team', true],
    ['export-milestone-50-countries', 'Prawnique Reaches Export Milestone: Now Serving 50+ Countries', 'A major achievement in our global expansion as we celebrate reaching customers across six continents.', 'We are proud to announce that Prawnique has successfully expanded its reach to over 50 countries worldwide, marking a significant milestone in our journey to bring premium Bangladeshi seafood to global markets.\n\nThis achievement reflects our commitment to quality, reliability, and customer satisfaction. From Europe to Asia, North America to Australia, our products are now enjoyed by seafood lovers across diverse cultures and cuisines.\n\nOur success is built on strong partnerships with local distributors, rigorous quality control, and innovative cold-chain logistics that ensure our prawns arrive fresh and delicious, no matter the destination.', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop', 'Prawnique Team', true],
    ['new-processing-facility-opens', 'State-of-the-Art Processing Facility Opens in Chittagong', 'Our new facility incorporates the latest technology for enhanced quality control and increased production capacity.', 'Prawnique has inaugurated its newest processing facility in Chittagong, featuring cutting-edge technology and expanded capacity to meet growing international demand.\n\nThe facility includes advanced freezing systems, automated sorting equipment, and comprehensive quality testing laboratories. These improvements allow us to process larger volumes while maintaining our strict quality standards.\n\nThe new facility also creates over 200 jobs in the local community and incorporates sustainable practices including solar power generation and water recycling systems.', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&h=600&fit=crop', 'Prawnique Team', true]
];

module.exports = { settings, categories, sections, team, testimonials, news };
