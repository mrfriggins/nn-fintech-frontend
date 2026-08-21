import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Ticker from "../Ticker";

describe("Ticker", () => {
  it("renders nothing when stocks are missing or empty", () => {
    expect(render(<Ticker stocks={null as never} />).container).toBeEmptyDOMElement();
    expect(render(<Ticker stocks={[]} />).container).toBeEmptyDOMElement();
  });

  it("renders symbols, four-decimal prices, and change styling", () => {
    render(
      <Ticker
        stocks={[
          { symbol: "AAA", price: 12.3, change: "+1.2%" },
          { symbol: "BBB", price: 4, change: "-0.5%" },
          { symbol: "CCC", price: 9.87654 },
        ]}
      />,
    );

    expect(screen.getByText("AAA")).toBeInTheDocument();
    expect(screen.getByText("$12.3000")).toBeInTheDocument();
    expect(screen.getByText("+1.2%")).toHaveClass("text-[#00ff41]");
    expect(screen.getByText("-0.5%")).toHaveClass("text-red-500");
    expect(screen.getByText("$9.8765")).toBeInTheDocument();
    expect(screen.queryByText("undefined")).not.toBeInTheDocument();
  });
});
