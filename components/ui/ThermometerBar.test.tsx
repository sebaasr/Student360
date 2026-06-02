import { render, screen } from "@testing-library/react";
import { ThermometerBar } from "./ThermometerBar";

describe("ThermometerBar", () => {
  test("renders the label and computed percentage", () => {
    render(<ThermometerBar label="Credits" current={72} total={120} />);
    expect(screen.getByText("Credits")).toBeInTheDocument();
    expect(screen.getByText(/60%/)).toBeInTheDocument();
  });

  test("renders pacing warning when prop set", () => {
    render(
      <ThermometerBar
        label="ISPs"
        current={1}
        total={3}
        showPacingWarning
      />,
    );
    expect(screen.getByText(/Pacing risk/i)).toBeInTheDocument();
  });

  test("renders an alert label badge when provided", () => {
    render(
      <ThermometerBar
        label="Philosophy Minor"
        current={4}
        total={6}
        alertLabel="Undeclared"
      />,
    );
    expect(screen.getByText(/Undeclared/)).toBeInTheDocument();
  });
});
