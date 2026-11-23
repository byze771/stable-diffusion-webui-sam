import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// 正片规范：本地字体文件（public/fonts），一次请求，渲染稳定。
// 思源宋体 Heavy = Noto Serif SC 900；思源黑体 Medium = Noto Sans SC 500。
loadFont({family: 'Noto Serif SC', url: staticFile('fonts/NotoSerifSC-900.ttf'), weight: '900'});
loadFont({family: 'Noto Sans SC', url: staticFile('fonts/NotoSansSC-500.ttf'), weight: '500'});
loadFont({family: 'JetBrains Mono', url: staticFile('fonts/JetBrainsMono-400.ttf'), weight: '400'});
loadFont({family: 'JetBrains Mono', url: staticFile('fonts/JetBrainsMono-500.ttf'), weight: '500'});
