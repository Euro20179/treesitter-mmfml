module.exports = grammar({
    name: "mmfml",
    rules: {
        source_file: $ => repeat1(choice(
            $.divider,
            $.header1,
            $.header2,
            $.header3,
            $.header4,
            $.header5,
            $.header6,
            $.footnote_block,
            $.code_block,
            $.simple_marked_text
        )),
        simple_marked_text: $ => prec.left(repeat1(choice(
            $.bold,
            $.italic,
            $.strikethrough,
            $.underline,
            $.pre_sample,
            $.link,
            $.higlight,
            $.footnote_ref,
            $.plain,
            $.esc,
        ))),

        divider: $ => seq(prec.right(/[=\-\+_]+/), token.immediate("\n")),

        _footnote_text: $ => /[A-Za-z0-9\*\+]+/,
        footnote_block: $ => seq("\n^[", $._footnote_text, "]\n", $.simple_marked_text, "\n[/", $._footnote_text, "]"),

        esc: $ => seq("\\", /./),

        code_block: $ => seq(
            ">",
            choice(
                alias(token.immediate(/[A-Za-z0-9]+\n/), $.language),
                token.immediate(/\n/)
            ),
            alias(repeat1(/.+/), $.code_text),
            prec.left(token.immediate("\n<"))
        ),

        header1: $ => seq("=", $.simple_text, token.immediate(choice("=", "\n"))),
        header2: $ => seq("==", $.simple_text, token.immediate(choice("==", "\n"))),
        header3: $ => seq("===", $.simple_text, token.immediate(choice("===", "\n"))),
        header4: $ => seq("====", $.simple_text, token.immediate(choice("====", "\n"))),
        header5: $ => seq("=====", $.simple_text, token.immediate(choice("=====", "\n"))),
        header6: $ => seq("======", $.simple_text, token.immediate(choice("======", "\n"))),
        footnote_ref: $ => seq("^[", $.simple_text, "]"),
        bold: $ => seq("*", $.simple_marked_text, "*"),
        italic: $ => seq("/", $.simple_marked_text, "/"),
        strikethrough: $ => choice(seq("~", $.simple_marked_text, "~"), seq("-", $.simple_marked_text, "-")),
        underline: $ => seq("_", $.simple_marked_text, "_"),
        higlight: $ => seq("+", $.simple_marked_text, "+"),
        link: $ => seq(optional(seq("[", $.simple_marked_text, "]")), token.immediate("|"), $.plain, "|"),
        pre_sample: $ => seq("`", /[^`\n]+/, "`"),
        plain: $ => /[^><\*\/~\-_\[\]\|=`\+\^]+/,

        simple_text: $ => /[^\n]+/
    },
})
