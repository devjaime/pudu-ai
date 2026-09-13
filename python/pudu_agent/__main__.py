import sys

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "mcp":
        from pudu_agent.mcp_server import main as mcp_main

        raise SystemExit(mcp_main())
    from pudu_agent.search import main

    raise SystemExit(main())
