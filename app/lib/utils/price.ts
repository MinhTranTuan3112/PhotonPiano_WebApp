export function formatPrice(price: number, isRounded = false, formatMillionsToM = false) {
    price = isRounded ? Math.round(price) : price;
    const formattedPrice = new Intl.NumberFormat('vi-VN').format(price);

    return price >= 1_000_000 && formatMillionsToM ? `${(price / 1_000_000).toFixed(1)}M` : formattedPrice;
}