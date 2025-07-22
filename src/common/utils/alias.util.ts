export const genAlias = (modelName: string, existingAliases: string[]) => {
    const prefixMap: Record<string, string> = {
        admin: 'U',
        customer: 'C',
        pm: 'PM',
        project: 'P',
    };
    const prefix = prefixMap[modelName.toLowerCase()] || 'X';

    // Lấy tất cả số đã dùng
    const usedNumbers = new Set(
        existingAliases
            .filter(alias => alias.startsWith(prefix))
            .map(alias => {
                const num = alias.replace(prefix, '');
                return parseInt(num, 10);
            })
            .filter(num => !isNaN(num))
    );

    // Tìm số nhỏ nhất chưa dùng
    let nextNumber = 1;
    while (usedNumbers.has(nextNumber)) {
        nextNumber++;
    }

    const numberPart = nextNumber.toString().padStart(3, '0');
    return `${prefix}${numberPart}`;
};

