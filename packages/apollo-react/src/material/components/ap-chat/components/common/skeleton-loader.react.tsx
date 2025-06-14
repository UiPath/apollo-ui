/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import styled from '@emotion/styled';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { useChatScroll } from '../../providers/chat-scroll-provider.react';

const SkeletonLoaderContainer = styled('div')(() => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingBase,
}));

const SKELETON_HEIGHT = 32;
const SKELETON_GAP = Number(token.Spacing.SpacingBase.replace('px', ''));

export const SkeletonLoader = () => {
    const [ skeletonCount, setSkeletonCount ] = React.useState(0);
    const { overflowContainer } = useChatScroll();

    React.useEffect(() => {
        const calculateSkeletonCount = () => {
            if (overflowContainer) {
                const height = overflowContainer.clientHeight;
                const count = Math.floor((height) / (SKELETON_HEIGHT + SKELETON_GAP));
                setSkeletonCount(count);
            }
        };

        calculateSkeletonCount();
        window.addEventListener('resize', calculateSkeletonCount);
        return () => window.removeEventListener('resize', calculateSkeletonCount);
    }, [ overflowContainer ]);

    return (
        <SkeletonLoaderContainer>
            {[ ...Array(skeletonCount) ].map((_, index) => (
                <div key={index}>
                    <ap-skeleton
                        style={{
                            width: index % 3 === 0 ? '90%' : index % 2 === 0 ? '80%' : '70%',
                            height: `${SKELETON_HEIGHT}px`,
                        }}
                    ></ap-skeleton>
                </div>
            ))}
        </SkeletonLoaderContainer>
    );
};
