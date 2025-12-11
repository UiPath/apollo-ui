export const HAS_SKELETONS_CSS_CLASS = 'has-skeletons';

let didInjectGlobalStyles = false;
let skeletonInstancesCount = 0;

type SkeletonsCountChangedEventDetail = { count: number };
export type SkeletonsCountChangedEvent = CustomEvent<SkeletonsCountChangedEventDetail>;

const eventEmitter = new EventTarget();

function notifyActiveSkeletonsCountChanged() {
    eventEmitter.dispatchEvent(
        new CustomEvent<SkeletonsCountChangedEventDetail>(
            'countChanged',
            { detail: { count: skeletonInstancesCount } },
        ),
    );
}

function onActiveSkeletonsCountChanged() {
    notifyActiveSkeletonsCountChanged();

    // Start or Stop skeleton animations
    if (skeletonInstancesCount > 0) {
        document.body.classList.add(HAS_SKELETONS_CSS_CLASS);
    } else {
        document.body.classList.remove(HAS_SKELETONS_CSS_CLASS);
    }
}

const globalStyles = `
/* A shared custom css property to control the horizontal position of the skeleton shimmer background */
@property --ap-skeleton_background-position-x {
    syntax: "<percentage>";
    inherits: true;
    initial-value: 200%;
}

body.has-skeletons {
    animation: 2s anim-skeleton-shimmer linear infinite !important;
}

/* For accessibility, disable animations if the user has requested reduced motion */
@media (prefers-reduced-motion) {
    body.has-skeletons {
        animation: none !important;
    }
}

/* Animate the shimmer background from left to right (from outside of the viewport) */
@keyframes anim-skeleton-shimmer {
    0% {
        --ap-skeleton_background-position-x: 200%;
    }
    100% {
        --ap-skeleton_background-position-x: -200%;
    }
}
`;

export function ensureSkeletonGlobalStyles() {
    if (didInjectGlobalStyles) {
        return;
    }

    if (typeof document === 'undefined') {
        // Skip in SSR environments
        return;
    }

    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-ap-skeleton-global', 'true');
    styleElement.appendChild(document.createTextNode(globalStyles));
    document.head.appendChild(styleElement);
    didInjectGlobalStyles = true;
}

export function getSkeletonsEventEmitter() {
    return eventEmitter;
}

export function getActiveSkeletonsCount() {
    return skeletonInstancesCount;
}

export function onSkeletonInstanceCreated() {
    skeletonInstancesCount++;
    onActiveSkeletonsCountChanged();
}

export function onSkeletonInstanceDestroyed() {
    skeletonInstancesCount--;
    onActiveSkeletonsCountChanged();
}
