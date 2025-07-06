document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.slider-wrapper');
    const slides = document.querySelectorAll('.slide');
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');

    if (!wrapper) return; // अगर स्लाइडर मौजूद नहीं है, तो कुछ न करें

    let currentIndex = 0;
    const slideCount = slides.length;

    function goToSlide(index) {
        if (index < 0) {
            index = slideCount - 1;
        } else if (index >= slideCount) {
            index = 0;
        }
        wrapper.style.transform = `translateX(-${index * 100}%)`;
        currentIndex = index;
    }

    nextBtn.addEventListener('click', () => {
        goToSlide(currentIndex + 1);
    });

    prevBtn.addEventListener('click', () => {
        goToSlide(currentIndex - 1);
    });
    
    // हर 5 सेकंड में अपने आप स्लाइड बदलने के लिए
    setInterval(() => {
        goToSlide(currentIndex + 1);
    }, 5000);
});
