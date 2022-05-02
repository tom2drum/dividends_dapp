export default function formatAddress(address: string) {
    return address.slice(0, 8).toLowerCase() + '...' + address.slice(-8).toLowerCase();
}