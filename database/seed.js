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
    ['about_story_image', 'https://images.unsplash.com/photo-1504309250229-4f08315f3b5c?w=600&h=500&fit=crop'],
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
        button_link: '/products'
    },
    {
        key: 'hero_secondary_button',
        title: 'Hero Secondary Button',
        button_text: 'Contact Us',
        button_link: '/contact'
    },
    {
        key: 'about_preview',
        title: 'Your Trusted Seafood Partner',
        subtitle: 'About Us',
        content: 'We are dedicated to providing the highest quality prawns.',
        image_path: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&h=500&fit=crop',
        button_text: 'Learn More About Us',
        button_link: '/about'
    },
    {
        key: 'products_header',
        title: 'Premium Seafood Selection',
        subtitle: 'Our Products',
        content: 'Discover our range of premium prawns and seafood, sourced responsibly and processed with care.',
        button_text: 'View All Products',
        button_link: '/products'
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
        button_link: '/news'
    },
    {
        key: 'cta_section',
        title: 'Ready to Partner With Us?',
        content: 'Get in touch today to discuss your seafood requirements. We offer competitive pricing, reliable supply, and exceptional quality.',
        button_text: 'Get In Touch',
        button_link: '/contact'
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
        button_link: '/contact'
    },

    // ---------- Products page ----------
    {
        key: 'products_cta',
        title: 'Interested in Our Products?',
        content: 'Get in touch for pricing, specifications and export documentation.',
        button_text: 'Request a Quote',
        button_link: '/contact'
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
        '/img/team/rafiqul-islam.jpg',
        'rafiqul@prawnique.com',
        '',
        '',
        1
    ],
    [
        'Hasan Chowdhury',
        'Director of Operations & Supply Chain',
        'Hasan oversees everything between harvest and vessel: intake, grading, processing schedules and the cold chain that holds our product at temperature all the way to the port. He coordinates our processing facilities and freight partners so that shipments leave on time and arrive in the condition our buyers expect.',
        '/img/team/hasan-chowdhury.jpg',
        'hasan@prawnique.com',
        '',
        '',
        2
    ],
    [
        'Shahidul Islam Shahid',
        'Head of International Sales & Business Development',
        'Shahidul builds and manages Prawnique\'s relationships with importers, distributors and retail buyers across Europe, Asia and North America. He handles pricing, contract negotiation and export documentation, and is usually the first person a new buyer speaks to about specifications, volumes and lead times.',
        '/img/team/shahidul-islam-shahid.jpg',
        'shahidul@prawnique.com',
        '',
        '',
        3
    ],
    [
        'Asif Ahmed',
        'Quality Assurance & Food Safety Manager',
        'Asif runs our HACCP and BAP compliance programme and the laboratory checks behind it. Every consignment passes his team\'s inspection for size grading, cold-chain integrity, microbiological safety and antibiotic residue before it is cleared for export, and he maintains the certification records our international buyers audit against.',
        '/img/team/asif-ahmed.jpg',
        'asif@prawnique.com',
        '',
        '',
        4
    ]
];

// [client_name, company, position, content, rating, image_path, is_featured, display_order]
const testimonials = [
    ['James Whitfield', 'Northgate Seafoods', 'Head of Procurement, United Kingdom', 'Prawnique has supplied us for five seasons and the grading has never drifted. Counts are accurate, the cold chain holds, and paperwork arrives before the container does. That reliability is worth more to us than a lower price.', 5, '', true, 0],
    ['Marieke de Vries', 'Rotterdam Fine Foods', 'Import Manager, Netherlands', 'Their documentation is the cleanest we receive from South Asia. EU health certificates, traceability records and lab results are complete every time, which means our consignments clear customs without delays.', 5, '', true, 1],
    ['Kenji Matsuda', 'Sakura Marine Trading', 'Director, Japan', 'The black tiger shrimp holds its texture and colour after thawing, which our retail customers notice immediately. We have moved a growing share of our sourcing to Prawnique on the strength of that consistency.', 5, '', true, 2],
    ['Lorenzo Ferrari', 'Adriatica Foods', 'Purchasing Director, Italy', 'What stands out is the communication. We get harvest updates, honest lead times and a straight answer when something moves. For a supplier eight thousand kilometres away, that builds a lot of trust.', 5, '', true, 3]
];

// [slug, title, excerpt, content, featured_image, author, is_published, published_at]
const news = [
    ['sustainable-prawn-farming-bangladesh', 'Sustainable Prawn Farming: Leading the Way in Bangladesh', 'Our commitment to eco-friendly aquaculture practices is setting new standards in the industry.', 'Bangladesh has emerged as a global leader in sustainable prawn farming, with innovative techniques that protect marine ecosystems while delivering premium quality seafood.\n\nOur farms utilize advanced water management systems, natural feed supplements, and strict environmental monitoring to ensure minimal impact on local waterways. This approach not only preserves the delicate coastal ecosystem but also produces prawns with superior taste and nutritional value.\n\nThe integration of traditional farming wisdom with modern technology has created a model that other countries are now studying and implementing.', 'https://images.unsplash.com/photo-1504309250229-4f08315f3b5c?w=800&h=600&fit=crop', 'Prawnique Team', true, '2026-05-14T09:00:00.000Z'],
    ['new-processing-facility-opens', 'State-of-the-Art Processing Facility Opens in Chittagong', 'Our new facility incorporates the latest technology for enhanced quality control and increased production capacity.', 'Prawnique has inaugurated its newest processing facility in Chittagong, featuring cutting-edge technology and expanded capacity to meet growing international demand.\n\nThe facility includes advanced freezing systems, automated sorting equipment, and comprehensive quality testing laboratories. These improvements allow us to process larger volumes while maintaining our strict quality standards.\n\nThe new facility also creates over 200 jobs in the local community and incorporates sustainable practices including solar power generation and water recycling systems.', 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&h=600&fit=crop', 'Prawnique Team', true, '2026-06-05T09:00:00.000Z'],
    ["black-tiger-season-opens", "Black Tiger Season Opens Across the Southwest Delta", "Harvesting has begun at our partner farms in Khulna, Bagerhat and Satkhira, with early grading pointing to a strong run of larger counts.", "The first ponds of the season have been drained across the southwest delta, and the early indications are good. Grading at intake is showing a healthy share of 16/20 and 21/25 counts, which are the sizes our European and Japanese buyers ask for first.\n\nA mild pre-monsoon and steady salinity through the growing period gave the crop a longer window than last year. Our farm team spent the off-season working with partner farms on stocking density and water exchange, and that patience is showing up in both size and shell quality.\n\nAllocations for the first shipments are being confirmed now. Buyers who have already reserved volume will be contacted with confirmed counts and loading dates this week.", "https://images.unsplash.com/photo-1550951791-cbf1ff280109?w=800&h=600&fit=crop", 'Prawnique Team', true, "2026-09-02T09:00:00.000Z"],
    ["blast-freezing-line-commissioned", "New Blast Freezing Line Cuts the Time From Pond to Minus Eighteen", "A second blast freezing line at our Chittagong facility shortens the window between harvest and core freezing, protecting texture and colour.", "Quality in frozen shrimp is decided in the first few hours after harvest. Every hour a prawn spends above freezing costs texture, and no amount of careful handling later will bring it back.\n\nOur second blast freezing line is now running at the Chittagong facility, roughly halving the time between intake and a fully frozen core. Product moves from grading to the tunnel in a single chilled pass, and core temperature is logged for every batch rather than sampled.\n\nFor buyers this means firmer texture on thaw, better colour retention and a cold-chain record that stands up to audit. It also lifts our daily throughput during peak season, so large orders no longer queue behind each other.", "https://images.unsplash.com/photo-1578069744397-2f3942a02a7b?w=800&h=600&fit=crop", 'Prawnique Team', true, "2026-08-18T09:00:00.000Z"],
    ["certifications-renewed-2026", "HACCP, BAP and BRCGS Certifications Renewed for 2026", "Our processing facility has cleared its annual audits, with no major non-conformities raised across food safety, traceability or welfare.", "Prawnique has completed its 2026 audit cycle. HACCP, BAP and BRCGS certifications have all been renewed for the processing facility, and our partner farms have retained their BAP status.\n\nThe auditors reviewed cold-chain records, antibiotic residue testing, effluent management and farm-level traceability. No major non-conformities were raised. The two minor observations, both relating to documentation formatting, were closed within the same week.\n\nCertification is not a trophy for us. It is the thing that lets a buyer in Rotterdam or Tokyo accept a container without re-testing it, and it is why we treat the paperwork with the same care as the product.", "https://images.unsplash.com/photo-1674066625481-8cffd7cf5aac?w=800&h=600&fit=crop", 'Prawnique Team', true, "2026-07-29T09:00:00.000Z"],
    ["european-buyers-visit-farms", "European Buyers Tour Our Farms and Processing Plant", "Importers from the UK, Netherlands and Italy spent four days walking the supply chain, from pond to packing line.", "Four days, six partner farms and one processing plant. Buyers from three European markets joined us this month to see how the product they order is actually grown, graded and packed.\n\nThe group walked the ponds in Satkhira, sat in on a morning intake and grading session, and reviewed our traceability records against a container they had received earlier in the year. We also put the same lot in front of them cooked, which is the only test that really settles an argument about quality.\n\nVisits like this are worth more than any brochure. They also tend to produce the most useful feedback we get all year, and several changes to our packing specification came directly out of this trip.", "https://images.unsplash.com/photo-1626727873980-fa047e09507f?w=800&h=600&fit=crop", 'Prawnique Team', true, "2026-07-10T09:00:00.000Z"],
    ["coastal-fleet-partnership", "Working Closer With the Coastal Fleet on Wild-Caught Lines", "A new arrangement with fishing communities along the Bay of Bengal gives us same-day intake on wild-caught prawns and a fairer price at the landing.", "Alongside our farmed supply, Prawnique has been building direct relationships with small fishing operators along the Bay of Bengal coast.\n\nThe arrangement is simple. Boats land at agreed points, our chilled transport is waiting, and payment is settled at the landing rather than weeks later through a chain of intermediaries. In return we get same-day intake, which is the only way wild-caught product reaches export grade.\n\nIt has meant a better price at the quayside for the crews and a shorter, more traceable chain for our buyers. We are expanding the programme to two further landing sites before the next season.", "https://images.unsplash.com/photo-1491655275136-b70f977cb5da?w=800&h=600&fit=crop", 'Prawnique Team', true, "2026-06-21T09:00:00.000Z"]
];

module.exports = { settings, categories, sections, team, testimonials, news };
