// === FAQ Accordion ===
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const item = button.parentElement;
        const isActive = item.classList.contains('active');
        
        // Close all
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        
        // Open clicked (if it wasn't already open)
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// === Smooth Scroll for CTA links ===
document.querySelectorAll('a[href="#order"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('order').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});

// === Form Submission ===
document.getElementById('orderForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Show confirmation
    const btn = e.target.querySelector('.btn-submit');
    btn.textContent = '✅ تم إرسال طلبك بنجاح!';
    btn.style.background = '#2d6a4f';
    btn.disabled = true;
    
    // Log order (replace with your backend)
    console.log('New Order:', data);
    
    // Reset after 3 seconds
    setTimeout(() => {
        btn.textContent = 'تأكيد الطلب - الدفع عند الاستلام';
        btn.style.background = '#25D366';
        btn.disabled = false;
    }, 3000);
});
