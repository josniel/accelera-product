// 'use client';

// import { css } from '@/styled-system/css';
// import { a, useTransition } from '@react-spring/web';
// import { match, P } from 'ts-pattern';
// import { ConnectKitButton } from 'connectkit';
// import { shortenAddress, IconAccount, ShowAfter } from '@liquity2/uikit';
// import { useMediaQuery } from '@/library/hooks/useMediaQuery';
// import { useSwitchChain } from 'wagmi';
// import { FALLBACK_CHAIN_ID } from '@/library/constants/default-chain-info';
// import content from '@/src/content';

// export function AccountButton() {
//   return (
//     <ShowAfter delay={500}>
//       <ConnectKitButton.Custom>
//         {(props) => <CKButton {...props} />}
//       </ConnectKitButton.Custom>
//     </ShowAfter>
//   );
// }

// function CKButton({
//   chain,
//   isConnected,
//   isConnecting,
//   address,
//   ensName,
//   show,
// }: Parameters<NonNullable<ComponentPropsWithRef<typeof ConnectKitButton.Custom>["children"]>>[0]) {
//   const isDesktop = useMediaQuery('(min-width: 1024px)');
//   const wrongChain = chain?.unsupported;
//   const { switchChain } = useSwitchChain();

//   const status = match({ chain, isConnected, isConnecting, address })
//     .returnType<
//       | { mode: 'connected'; address: `0x${string}` }
//       | { mode: 'connecting' | 'disconnected' | 'unsupported'; address?: never }
//     >()
//     .with(P.union({ chain: { unsupported: true } }, { isConnected: true, chain: P.nullish }), () => ({ mode: 'unsupported' }))
//     .with({ isConnected: true, address: P.nonNullable }, ({ address }) => ({ address, mode: 'connected' }))
//     .with({ isConnecting: true }, () => ({ mode: 'connecting' }))
//     .otherwise(() => ({ mode: 'disconnected' }));

//   const transition = useTransition(status, {
//     keys: ({ mode }) => String(mode === 'connected'),
//     from: { opacity: 0, transform: 'scale(0.9)' },
//     enter: { opacity: 1, transform: 'scale(1)' },
//     leave: { opacity: 0, display: 'none', immediate: true },
//     config: { mass: 1, tension: 2400, friction: 80 },
//   });

//   return transition((spring, { mode, address }) => {
//     const containerProps = {
//       className: css({ display: 'flex', alignItems: 'center', height: '100%' }),
//       style: spring,
//     } as const;

//     const commonWrapperStyle =
//       'relative flex items-center w-full min-h-[50px] max-h-[50px] px-4 lg:text-sm text-xs font-semibold overflow-hidden border rounded-[100px] transition-all gap-4 cursor-pointer whitespace-nowrap' +
//       (isDesktop
//         ? ' bg-[#171717] hover:bg-[#202020] border-transparent'
//         : ' bg-[#1A201C] hover:bg-[#222A25] border-woodsmoke-800');

//     return (
//       <a.div {...containerProps}>
//         <div
//           className={commonWrapperStyle}
//           onClick={() => {
//             if (wrongChain) {
//               switchChain({ chainId: FALLBACK_CHAIN_ID });
//             } else {
//               show?.();
//             }
//           }}
//         >
//           {mode === 'connected' ? (
//             <>
//               <div className="relative !w-[32px] !h-[32px] rounded-full bg-palm-green-950 flex items-center justify-center flex-shrink-0">
//                 <IconAccount className="text-palm-green-400 text-xl" />
//               </div>
//               <div className="flex items-center justify-between w-full">
//                 <div className="flex flex-col items-start">
//                   <div className="flex items-center gap-2">
//                     <div className={`w-2 h-2 ${wrongChain ? 'bg-[#EB5757]' : 'bg-[#2FB869]'} rounded-full`} />
//                     <div className="text-[#F6F6F6] font-normal text-[10px] leading-normal">
//                       {shortenAddress(address, 3)}
//                     </div>
//                   </div>
//                 </div>
//                 <div className="icon-settings-1 text-2xl text-woodsmoke-800 group-hover:text-pastel-green-400 transition-all" />
//               </div>
//             </>
//           ) : (
//             <ButtonNotConnected mode={mode} show={show} />
//           )}
//         </div>
//       </a.div>
//     );
//   });
// }

// function ButtonNotConnected({
//   mode,
//   show,
// }: {
//   mode: 'connecting' | 'disconnected' | 'unsupported';
//   show?: () => void;
// }) {
//   const label =
//     mode === 'connecting'
//       ? 'Connecting…'
//       : mode === 'unsupported'
//       ? content.accountButton.wrongNetwork
//       : content.accountButton.connectAccount;

//   return (
//     <button
//       onClick={show}
//       className="w-full text-white font-semibold text-sm px-4 py-2 rounded-full bg-[#1A201C] hover:bg-[#222A25] border border-woodsmoke-800"
//     >
//       {label}
//     </button>
//   );
// }
