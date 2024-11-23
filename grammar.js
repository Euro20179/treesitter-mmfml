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
      $.metadata_tag
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

    metadata_tag: $ => prec.left(seq(
      ">metadata\n",
      repeat1(
        seq(
          seq(alias($.plain, $.metadata_key), ":"),
          alias($.plain, $.metadata_value),
          "\n",
        )
      ),
      "<\n"
    )),

    list: $ => token.immediate(
      seq(
        repeat1(/\s/),
        choice(
          choice("-", "•"),
          seq(
            repeat1(/\d/),
            choice(".", "\x29") //29 is close paren
          ),
          seq(
            repeat1(/[A-Za-z]/),
            choice(".", "\x29")
          )
        ),
        /\s/
      )
    ),

    divider: $ => token.immediate(
      seq(
        repeat1(
          choice(
            " ",
            "=",
            "-",
            "+",
            "_",
            ":",
            "—",
            "–",
            "‗",
            "‾",
            "━",
          )
        ),
        // repeat1(/[=\-\+_:]+/),
        "\n"
      )
    ),

    footnote_name_text: $ => repeat1(/[A-Za-z0-9\*\+\-_]/),
    footnote_block: $ => seq(
      alias(seq(
        "\n^[",
        alias($.footnote_name_text, $.footnote_block_name),
        "]:\n"
      ), $.footnote_start),
      repeat1($.simple_marked_text),
      seq(
        alias("\n[/", $.footnote_end),
        $.footnote_name_text,
        alias("]", $.footnote_end)
      )
    ),

    esc: $ => seq(
      alias("\\", $.backslash),
      field("char", alias(/./, $.escaped_char))
    ),

    code_block: $ => seq(
      alias(">", $.code_block_start_arrow),
      choice(
        field("language", alias(token.immediate(/[A-Za-z0-9]+\n/), $.language)),
        token.immediate(/\n/)
      ),
      alias(repeat1(/.+/), $.code_text),
      prec.left(token.immediate(seq("\n", repeat(/\s/), "<")))
    ),

    header1: $ => seq("=", $.simple_marked_text, token.immediate(choice("=", "\n"))),
    header2: $ => seq("==", $.simple_marked_text, token.immediate(choice("==", "\n"))),
    header3: $ => seq("===", $.simple_marked_text, token.immediate(choice("===", "\n"))),
    header4: $ => seq("====", $.simple_marked_text, token.immediate(choice("====", "\n"))),
    header5: $ => seq("=====", $.simple_marked_text, token.immediate(choice("=====", "\n"))),
    header6: $ => seq("======", $.simple_marked_text, token.immediate(choice("======", "\n"))),

    footnote_ref: $ => seq(
      alias("^[", $.footnote_start),
      $.footnote_name_text,
      alias("]", $.footnote_end)
    ),

    link: $ => seq(
      optional(seq(
        "[",
        $.simple_marked_text,
        "]"
      )),
      token.immediate(seq("|", repeat(" "))),
      alias(prec.left(repeat1(/[^|\n]/)), $.link_url),
      token.immediate(seq(repeat(" "), "|"))
    ),

    bold: $ => seq(alias("*", $.bold_start), $.simple_marked_text, alias("*", $.bold_end)),
    italic: $ => seq(alias("/", $.italic_start), $.simple_marked_text, alias("/", $.italic_end)),
    strikethrough: $ => seq(alias("~", $.strikethrough_start), $.simple_marked_text, alias("~", $.strikethrough_end)),
    underline: $ => seq(alias("_", $.underline_start), $.simple_marked_text, alias("_", $.underline_end)),
    pre_sample: $ => seq(alias("`", $.pre_sample_start), /[^`\n]+/, alias("`", $.pre_sample_end)),
    higlight: $ => seq(alias("+", $.higlight_start), $.simple_marked_text, alias("+", $.higlight_end)),
    anchor: $ => seq(alias("#", $.anchor_start), $.simple_marked_text, alias("#", $.anchor_end)),

    plain: $ => prec.right(repeat1(choice(/\s/, /./))),
    // simple_text: $ => /[^\n=]+/
  },
})
