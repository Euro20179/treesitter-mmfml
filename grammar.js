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
            prec(10, $.code_block),
            $.list,
            prec(1, $.simple_marked_text),
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
            $.anchor,
            $.plain,
            $.esc,
        ))),

        list: $ => seq(alias(token.immediate(/\s+(?:-|\d+[\.\)]?)\s/), $.list_indicator)),

        divider: $ => token.immediate(repeat1(/[=\-\+_]+/), token.immediate("\n")),

        _footnote_name_text: $ => repeat1(/[A-Za-z0-9\*\+]/),
        footnote_block: $ => seq("\n^[", alias($._footnote_name_text, $.footnote_block_name), "]:\n", repeat1($.simple_marked_text), "\n[/", $._footnote_name_text, "]"),

        esc: $ => seq(alias("\\", $.backslash) , field("char", alias(/./, $.escaped_char))),

        code_block: $ => seq(
            alias(">", $.code_block_start_arrow),
            choice(
                field( "language", alias(token.immediate(/[A-Za-z0-9]+\n/), $.language)),
                token.immediate(/\n/)
            ),
            alias(repeat1(/.+/), $.code_text),
            prec.left(alias(token.immediate("\n<"), $.code_block_end_arrow))
        ),

        header1: $ => seq("=", $.simple_text, token.immediate(choice("=", "\n"))),
        header2: $ => seq("==", $.simple_text, token.immediate(choice("==", "\n"))),
        header3: $ => seq("===", $.simple_text, token.immediate(choice("===", "\n"))),
        header4: $ => seq("====", $.simple_text, token.immediate(choice("====", "\n"))),
        header5: $ => seq("=====", $.simple_text, token.immediate(choice("=====", "\n"))),
        header6: $ => seq("======", $.simple_text, token.immediate(choice("======", "\n"))),

        footnote_ref: $ => seq(alias("^[", $.footnote_start), $.plain, alias("]", $.footnote_end)),
        link: $ => seq(optional(seq("[", $.simple_marked_text, "]")), token.immediate("|"), alias(/[^|\n]+/, $.link_url), "|"),

        bold: $ => seq(alias("*", $.bold_start), $.simple_marked_text, alias("*", $.bold_end)),
        italic: $ => seq(alias("/", $.italic_start), $.simple_marked_text, alias("/", $.italic_end)),
        strikethrough: $ => seq(alias("~", $.strikethrough_start), $.simple_marked_text, alias("~", $.strikethrough_end)),
        underline: $ => seq(alias("_", $.underline_start), $.simple_marked_text, alias("_", $.underline_end)),
        pre_sample: $ => seq(alias("`", $.pre_sample_start), /[^`\n]+/, alias("`", $.pre_sample_end)),
        higlight: $ => seq(alias("+", $.higlight_start), $.simple_marked_text, alias("+", $.higlight_end)),
        anchor: $ => seq(alias("#", $.anchor_start), $.simple_marked_text, alias("#", $.anchor_end)),

        plain: $ => prec.right(repeat1(choice(/\s/, /./))),
        simple_text: $ => /[^\n]+/
    },
})
