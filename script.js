document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. AI Typing Effect for Header ---
    const typingElement = document.getElementById('typing-text');
    const phrases = ["Machine Learning.", "AI Optimization.", "Neural Networks.", "Smart Configs."];
    let phraseIndex = 0;
    let letterIndex = 0;
    let currentText = "";
    let isDeleting = false;

    function typeEffect() {
        const fullText = phrases[phraseIndex];

        if (isDeleting) {
            currentText = fullText.substring(0, letterIndex - 1);
            letterIndex--;
        } else {
            currentText = fullText.substring(0, letterIndex + 1);
            letterIndex++;
        }

        typingElement.innerHTML = currentText;

        let typeSpeed = isDeleting ? 50 : 100;

        if (!isDeleting && currentText === fullText) {
            typeSpeed = 2000; // Pause at the end of a word
            isDeleting = true;
        } else if (isDeleting && currentText === "") {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500; // Pause before typing next word
        }

        setTimeout(typeEffect, typeSpeed);
    }
    
    // Start typing effect
    setTimeout(typeEffect, 1000);


    // --- 2. Scroll Reveal Animation ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    revealElements.forEach(el => revealOnScroll.observe(el));


    // --- 3. AI Chat Widget Toggle ---
    const aiToggleBtn = document.getElementById('ai-toggle-btn');
    const aiChatWindow = document.getElementById('ai-chat');

    aiToggleBtn.addEventListener('click', () => {
        aiChatWindow.classList.toggle('hidden');
        
        // Stop pulsing when opened
        if (!aiChatWindow.classList.contains('hidden')) {
            aiToggleBtn.classList.remove('pulse-anim');
            aiToggleBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        } else {
            aiToggleBtn.classList.add('pulse-anim');
            aiToggleBtn.innerHTML = '<i class="fa-solid fa-robot"></i>';
        }
    });

    // --- 4. Interactive Search AI Glow ---
    const heroSearch = document.getElementById('hero-search');
    heroSearch.addEventListener('keyup', (e) => {
        if(e.target.value.length > 0) {
            heroSearch.parentElement.style.boxShadow = "0 0 0 1px #00f2fe, 0 0 30px rgba(0, 242, 254, 0.4)";
        } else {
            heroSearch.parentElement.style.boxShadow = "";
        }
    });
});
