# Combo Tab

combo tab is a plugin that allows you to execute snippets continuously.

这个插件允许你连续使用tab键执行snippets

## Description

Sometimes I'd like to set snippets seeming like this:

有时候我会这么设置snippets:

```json
{
    "function short case": {
        "prefix": "fu",
        "body": [
            "func",
        ]
    },
    "function case": {
        "prefix": "func",
        "body": [
            "function $1() {\n\n}"
        ]
    }
}
```

In this case, when I type `fu` and press tab, I'd like to get `func` and then I can press tab again to get `function (){}`.

在这种情况下，当我输入`fu`并按下tab键时，我希望得到`func`，然后我再按下tab键就可以得到`function (){}`。

## Explain

This plugin detects whether there is a matching snippet by getting the local snippets file

When the editor triggers the tab key, it will detect whether the left side of the current cursor position matches the prefix of a snippet.

If there is a blank character on the left side, it will first trigger to accept the inline code prompt (code similar to AI tool tips). If the cursor position does not change after triggering, continue to execute the tab key.

Otherwise, if the left side is not a blank character, check whether the left side matches the prefix of a snippet. If it matches, insert the snippet.

Currently, only the snippets files corresponding to the file type are detected, and the global snippets files are not detected yet.

这个插件通过获取本地的snippets文件来检测是否存在匹配的snippet

当编辑器触发tab键时，会检测当前光标所在的位置的左侧是否匹配某个snippet的prefix

如果左侧是空白字符，就先触发接受行内代码提示（类似AI工具提示的代码），如果触发后光标位置不变，则继续执行tab键

否则，如果左侧不是空白字符，则检测左侧是否匹配某个snippet的prefix，如果匹配，则执行插入snippet

目前仅检测了文件类型对应的snippets文件，暂未检测全局的snippets文件

## Remote Development

If you are developing remotely, you need to copy and synchronize the local snippets files to the remote server.

如果是远程开发，你需要把本地的snippets文件复制同步到远程服务器上