export function formatPrice(price: number, isRounded = false) {
    price = isRounded ? Math.round(price) : price;
    const formattedPrice = new Intl.NumberFormat('vi-VN').format(price);

    return formattedPrice;
}