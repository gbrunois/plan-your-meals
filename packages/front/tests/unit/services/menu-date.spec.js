import { MenuDate } from '@/api/days/menu-date';
describe('MenuDate', () => {
    describe('toString', () => {
        it('should return the formatted date', () => {
            const aMenuDate = new MenuDate('2012-01-01');
            expect(aMenuDate.toString()).toBe('2012-01-01');
        });
    });
    describe('toLongFormat', () => {
        it('should return the date in long format', () => {
            const aMenuDate = new MenuDate('2012-01-01');
            expect(aMenuDate.toLongFormat()).toBe('dimanche 1er janvier');
        });
    });
    describe('toShortFormat', () => {
        it('should return the date in short format', () => {
            const aMenuDate = new MenuDate('2012-01-01');
            expect(aMenuDate.toShortFormat()).toBe('1er janvier');
        });
    });
});
//# sourceMappingURL=menu-date.spec.js.map