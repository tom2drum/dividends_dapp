export default async function sleep(ms = 0) {
    return new Promise((done) => {
        const timeout = window.setTimeout(() => {
            done(timeout);
        }, ms);
    });
}
