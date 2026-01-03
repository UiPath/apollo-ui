// Auto-generated from object/component/component-business-rule.svg
import React from 'react';

export interface ComponentBusinessRuleProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ComponentBusinessRule = React.forwardRef<SVGSVGElement, ComponentBusinessRuleProps>(
  ({ size, ...props }, ref) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
      width={size ?? 24}
      height={size ?? 24}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.63635 5.72726L4.61087 2.29512C4.97349 1.87672 5.49988 1.63635 6.05355 1.63635H17.9464C18.5001 1.63635 19.0265 1.87672 19.3891 2.29512L22.3636 5.72726V20.4545C22.3636 21.5089 21.5089 22.3636 20.4545 22.3636H3.54544C2.49108 22.3636 1.63635 21.5089 1.63635 20.4545V5.72726ZM6.05355 3.27272H17.9464C18.0255 3.27272 18.1007 3.30705 18.1525 3.36683L19.4891 4.90908H4.51084L5.84746 3.36683C5.89926 3.30705 5.97446 3.27272 6.05355 3.27272ZM20.7273 6.54544H3.27272L3.27272 20.4545C3.27272 20.6052 3.39482 20.7273 3.54544 20.7273H20.4545C20.6052 20.7273 20.7273 20.6052 20.7273 20.4545V6.54544Z"
        fill="currentColor"
      />
      <path
        d="M15.7149 19.0909H8.28497C7.8034 19.0909 7.39308 18.9214 7.05401 18.5823C6.71494 18.2432 6.54541 17.8329 6.54541 17.3514V9.92138C6.54541 9.43293 6.71494 9.02089 7.05401 8.68526C7.39308 8.34964 7.8034 8.18182 8.28497 8.18182H15.7149C16.1965 8.18182 16.6068 8.34964 16.9459 8.68526C17.285 9.02089 17.4545 9.43293 17.4545 9.92138V17.3514C17.4545 17.8329 17.285 18.2432 16.9459 18.5823C16.6068 18.9214 16.1965 19.0909 15.7149 19.0909ZM8.36359 11.2121H15.6363V10H8.36359V11.2121ZM9.59701 13.0303H8.36359V17.3514H9.59701V13.0303ZM14.4242 13.0303L14.4029 17.3514H15.6363V13.0303H14.4242ZM12.606 13.0303H11.3939V17.3514H12.606V13.0303Z"
        fill="currentColor"
      />
    </svg>
  )
);

ComponentBusinessRule.displayName = 'ComponentBusinessRule';

export default ComponentBusinessRule;
