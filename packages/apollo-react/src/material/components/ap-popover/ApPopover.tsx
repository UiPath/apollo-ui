import Popover, { PopoverProps } from '@mui/material/Popover';
import token from '@uipath/apollo-core';

export const ApPopover: React.FC<PopoverProps> = (props) => {
  const {
    anchorOrigin = {
      vertical: 'bottom',
      horizontal: 'left',
    },
    transformOrigin = {
      vertical: 'top',
      horizontal: 'left',
    },
    anchorReference,
    anchorPosition,
    sx,
    children,
    open,
    anchorEl,
    onClose,
    ...rest
  } = props;

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorEl={anchorEl}
      sx={{
        '& .MuiPaper-root': {
          borderRadius: token.Border.BorderRadiusS,
          background: 'var(--color-background)',
          boxShadow: token.Shadow.ShadowDp6,
        },
        ...sx,
      }}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      anchorReference={anchorReference ?? (anchorPosition && !anchorEl ? 'anchorPosition' : 'anchorEl')}
      anchorPosition={anchorPosition}
      {...rest}
    >
      {children}
    </Popover>
  );
};

ApPopover.displayName = 'ApPopover';
