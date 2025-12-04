/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';

export const VisuallyHidden = styled('span')({
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
});
