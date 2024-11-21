set makeprg=tree-sitter\ generate

command Mk execute 'make' | TSUpdate

nmap <m-m> <CMD>Mk<CR>
