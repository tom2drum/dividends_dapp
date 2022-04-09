export default function formatAddress(address: string) {
    return address.slice(0, 25).toLowerCase() + '...';
}